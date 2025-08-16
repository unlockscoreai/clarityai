
'use server';

import {NextResponse} from 'next/server';
import {auth} from '@/lib/firebase/server';
import {stripe} from '@/lib/stripe';
import {headers} from 'next/headers';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { coupons } from '@/lib/coupons';

export async function POST(req: Request) {
  const { plan, credits, coupon, user: authedUser } = await req.json();
  const headersList = headers();
  const origin = headersList.get('origin');

  try {
    const session = await auth.verifyIdToken(
      headersList.get('Authorization')?.split('Bearer ')[1] || ''
    );
    
    if (!session || session.uid !== authedUser.uid) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }
    
    const customer = await stripe.customers.create({
      email: session.email,
      name: authedUser.displayName,
      metadata: {
          firebaseUID: session.uid
      }
    });
    const stripeCustomerId = customer.id;

    const line_items = [];
    let planIdentifier = '';
    let mode: Stripe.Checkout.SessionCreateParams.Mode = 'payment'; // Default to one-time payment

    if (plan) {
        planIdentifier = plan.name.toLowerCase();
        mode = 'subscription'; // Set to subscription mode for plans
        line_items.push({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: plan.name,
                    description: plan.credits,
                },
                unit_amount: parseInt(plan.price.replace('$', '')) * 100,
                recurring: {
                    interval: 'month',
                }
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

    const checkoutSessionOptions: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items,
      mode,
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/credits`,
      metadata: {
        firebaseUID: session.uid,
        stripeCustomerId: stripeCustomerId,
        plan: planIdentifier,
      },
    };
    
    // Check if a valid coupon code is provided
    if (coupon && coupons[coupon as keyof typeof coupons]) {
        const createdStripeCoupons = await stripe.coupons.list();
        const stripeCoupon = createdStripeCoupons.data.find(c => c.name?.toUpperCase().startsWith(coupon));

        if (stripeCoupon) {
            checkoutSessionOptions.discounts = [{ coupon: stripeCoupon.id }];
        } else {
             console.warn(`Stripe coupon for code "${coupon}" not found.`);
        }
    }


    const checkoutSession = await stripe.checkout.sessions.create(checkoutSessionOptions);

    return NextResponse.json({ sessionId: checkoutSession.id });

  } catch (err: any) {
    console.error('Error creating checkout session:', err);
    return NextResponse.json(
      {error: 'Error creating checkout session'},
      {status: 500}
    );
  }
}
