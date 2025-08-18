
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import type { Stripe } from 'stripe';
import { doc, updateDoc, serverTimestamp, increment, runTransaction, setDoc } from "firebase/firestore";
import { adminDB } from "@/lib/firebase/server"; // Correctly import server-side db

// Helper to determine credits to add from line items
const getCreditsFromLineItems = (lineItems: Stripe.LineItem[]): number => {
    let credits = 0;
    lineItems.forEach(item => {
        const productName = item.price?.product && typeof item.price.product === 'object' ? item.price.product.name : '';
        if (productName.toLowerCase().includes('credit pack')) {
            const match = productName.match(/(\d+)\s*Credit/);
            if (match) {
                credits += parseInt(match[1], 10);
            }
        }
        // Add logic for subscription plans if they grant initial credits
        else if (productName.toLowerCase() === 'pro') credits += 3;
        else if (productName.toLowerCase() === 'vip') credits += 10;
        else if (productName.toLowerCase() === 'starter') credits += 1;
    });
    return credits;
}

const getCreditsFromCoupon = (session: Stripe.Checkout.Session): number => {
    const coupon = session.discount?.coupon;
    if (coupon && coupon.metadata && coupon.metadata.credits) {
        return parseInt(coupon.metadata.credits, 10);
    }
    return 0;
}


export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const firebaseUID = session.metadata?.firebaseUID;
    if (!firebaseUID) {
      console.error("Webhook Error: No firebaseUID in session metadata.");
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { expand: ['data.price.product'] });
      const expandedSession = await stripe.checkout.sessions.retrieve(session.id, { expand: ['discount.coupon'] });
      
      const creditsFromPurchase = getCreditsFromLineItems(lineItems.data);
      const creditsFromCoupon = getCreditsFromCoupon(expandedSession);
      const totalCreditsToAdd = creditsFromPurchase + creditsFromCoupon;
      
      // Safely access metadata
      const { stripeCustomerId, plan, affiliateId, clientId } = session.metadata || {};

      const updateData: { [key: string]: any } = {
          updatedAt: serverTimestamp()
      };

      if (stripeCustomerId) {
          updateData.stripeCustomerId = stripeCustomerId;
      }
      if (totalCreditsToAdd > 0) {
        updateData.credits = increment(totalCreditsToAdd);
      }
      
      if (plan) {
          updateData['subscription.plan'] = plan;
          updateData['subscription.status'] = 'active';
          updateData['subscription.stripeSessionId'] = session.id;
      }

      // If affiliateId and clientId are present, update the client record
      if (affiliateId && clientId) {
          const clientDocRef = doc(adminDB, "affiliates", affiliateId, "clients", clientId);
          await setDoc(clientDocRef, updateData, { merge: true });
          console.log(`Successfully processed checkout for affiliate client: ${clientId}. Total credits added: ${totalCreditsToAdd}`);

      } else {
          // Otherwise, update the main user record
          const userDocRef = doc(adminDB, "users", firebaseUID);
          await updateDoc(userDocRef, updateData);
          console.log(`Successfully processed checkout for user: ${firebaseUID}. Total credits added: ${totalCreditsToAdd}`);
      }


    } catch (dbError: any) {
        console.error('Error updating Firestore from webhook:', dbError);
        return NextResponse.json({ error: `Database Error: ${dbError.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
