
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import type { Stripe } from 'stripe';
import { doc, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

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
    const stripeCustomerId = session.customer;

    if (!firebaseUID) {
      console.error("Webhook Error: No firebaseUID in session metadata.");
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    try {
      // Retrieve line items to determine what was purchased
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      
      const creditsToAdd = getCreditsFromLineItems(lineItems.data);
      const planName = lineItems.data[0].price?.product.name ?? 'Pro'; // Default or derive more robustly

      const userDocRef = doc(db, "users", firebaseUID);
      
      const updateData: { [key: string]: any } = {
          stripeCustomerId: stripeCustomerId,
          updatedAt: serverTimestamp()
      };

      if (creditsToAdd > 0) {
        updateData.credits = increment(creditsToAdd);
      }
      
      // Determine if a subscription plan was purchased
      const isSubscription = lineItems.data.some(item => 
          item.price?.product.name.toLowerCase() in ['starter', 'pro', 'vip']
      );

      if (isSubscription) {
          updateData.plan = planName.toLowerCase();
      }

      await updateDoc(userDocRef, updateData);

      console.log(`Successfully processed checkout for user: ${firebaseUID}. Credits added: ${creditsToAdd}`);

    } catch (dbError: any) {
        console.error('Error updating Firestore from webhook:', dbError);
        return NextResponse.json({ error: `Database Error: ${dbError.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
