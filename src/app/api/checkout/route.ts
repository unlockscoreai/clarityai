
'use server';

import {NextResponse} from 'next/server';
import {auth} from '@/lib/firebase/server';
import {stripe} from '@/lib/stripe';
import {headers} from 'next/headers';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export async function POST(req: Request) {
  const { plan, credits } = await req.json();
  const headersList = headers();
  const origin = headersList.get('origin');

  try {
    const session = await auth.verifyIdToken(
      headersList.get('Authorization')?.split('Bearer ')[1] || ''
    );
    
    if (!session) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const userDocRef = doc(db, 'users', session.uid);
    const userDoc = await getDoc(userDocRef);
    const user = userDoc.data();

    let stripeCustomerId = user?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: session.email,
        name: user?.fullName,
        metadata: {
            firebaseUID: session.uid
        }
      });
      stripeCustomerId = customer.id;
    }

    const line_items = [];

    if (plan) {
        line_items.push({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: plan.name,
                    description: plan.credits,
                },
                unit_amount: parseInt(plan.price.replace('$', '')) * 100,
            },
            quantity: 1,
        });
    }

    if (credits) {
         line_items.push({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: `${credits.credits} Credit Pack`,
                },
                unit_amount: credits.price * 100,
            },
            quantity: 1,
        });
    }

    if (line_items.length === 0) {
        return NextResponse.json({ error: 'No items in cart'}, {status: 400});
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/credits`,
      metadata: {
        firebaseUID: session.uid,
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id });

  } catch (err: any) {
    console.error('Error creating checkout session:', err);
    return NextResponse.json(
      {error: 'Error creating checkout session'},
      {status: 500}
    );
  }
}
