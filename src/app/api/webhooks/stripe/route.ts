
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import type { Stripe } from 'stripe';
import { doc, updateDoc, serverTimestamp, increment, runTransaction, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/server"; // Correctly import server-side db

// Helper to determine credits to add from line items
const getCreditsFromLineItems = (lineItems: Stripe.LineItem[]): number => {
    let credits = 0;
    lineItems.forEach(item => {
        const productName = item.price?.product.name ?? '';
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
    if (session.total_details?.amount_discounted && session.discounts?.length) {
      for (const discount of session.discounts) {
          // Ensure discount.coupon is not a string ID
          if (typeof discount.coupon !== 'string' && discount.coupon?.metadata?.credits) {
              return parseInt(discount.coupon.metadata.credits, 10);
          }
      }
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
    const { firebaseUID, stripeCustomerId, plan, affiliateId, clientId } = session.metadata || {};

    if (!firebaseUID && !clientId) {
      console.error("Webhook Error: No firebaseUID or clientId in session metadata.");
      return NextResponse.json({ error: 'Missing user or client ID' }, { status: 400 });
    }

    try {
      // Retrieve line items to determine what was purchased
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { expand: ['data.price.product'] });
      
      const creditsFromPurchase = getCreditsFromLineItems(lineItems.data);
      const creditsFromCoupon = getCreditsFromCoupon(session);
      const totalCreditsToAdd = creditsFromPurchase + creditsFromCoupon;
      
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
          const clientDocRef = doc(db, "affiliates", affiliateId, "clients", clientId);
          await setDoc(clientDocRef, updateData, { merge: true });
          console.log(`Successfully processed checkout for affiliate client: ${clientId}. Total credits added: ${totalCreditsToAdd}`);

      } else if (firebaseUID) {
          // Otherwise, update the main user record
          const userDocRef = doc(db, "users", firebaseUID);
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
