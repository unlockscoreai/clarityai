
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import type { Stripe } from 'stripe';
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    ) as Stripe.Event;

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const firebaseUID = session.metadata?.firebaseUID;
      const stripeCustomerId = session.metadata?.stripeCustomerId;

      if (firebaseUID) {
        const userDocRef = doc(db, "users", firebaseUID);
        
        const updateData: { [key: string]: any } = {
            upgraded: true,
            plan: 'Pro', // This can be made dynamic based on the purchased item
            upgradeDate: serverTimestamp()
        };

        if (stripeCustomerId) {
            updateData.stripeCustomerId = stripeCustomerId;
        }

        await updateDoc(userDocRef, updateData);

        console.log(`Successfully upgraded user: ${firebaseUID}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }
}
