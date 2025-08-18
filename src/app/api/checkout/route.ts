
'use server';

import {NextResponse, NextRequest} from 'next/server';
import {auth as adminAuth, adminDB} from '@/lib/firebase/server';
import {stripe} from '@/lib/stripe';
import {headers} from 'next/headers';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { coupons } from '@/lib/coupons';
import type Stripe from 'stripe';

const getStripeCustomerId = async (firebaseUID: string, email?: string): Promise<string> => {
    const userDocRef = doc(adminDB, 'users', firebaseUID);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists() && userDocSnap.data().stripeCustomerId) {
        return userDocSnap.data().stripeCustomerId;
    }

    // Create a new customer in Stripe
    const customer = await stripe.customers.create({
        email,
        metadata: { firebaseUID },
    });

    // Save the new customer ID to Firestore
    await updateDoc(userDocRef, { stripeCustomerId: customer.id });

    return customer.id;
};


export async function POST(req: NextRequest) {
  try {
    const { plan, credits: creditPack, coupon, user, affiliateId, clientId } = await req.json();
    const headersList = headers();
    const origin = headersList.get('origin') || 'http://localhost:9002';
    
    if (!user?.uid) {
      return NextResponse.json({ error: 'User is not authenticated.' }, { status: 401 });
    }

    const idToken = headersList.get('authorization')?.split('Bearer ')[1];
    if (!idToken) {
         return NextResponse.json({ error: 'No token provided.' }, { status: 401 });
    }
    
    // Verify the token to ensure the request is from the correct user
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (decodedToken.uid !== user.uid) {
        return NextResponse.json({ error: 'User token does not match.' }, { status: 403 });
    }

    const customerId = await getStripeCustomerId(user.uid, user.email);

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let sessionPlan = null;

    if (plan) {
      // Logic for subscription plans
      line_items.push({
          price_data: {
              currency: 'usd',
              product_data: {
                  name: plan.name,
              },
              unit_amount: parseInt(plan.price.replace('$', '')) * 100,
              recurring: { interval: 'month' },
          },
          quantity: 1,
      });
      sessionPlan = plan.name.toLowerCase();
    } else if (creditPack) {
      // Logic for one-time credit pack purchases
      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${creditPack.credits} Credit Pack`,
          },
          unit_amount: creditPack.price * 100,
        },
        quantity: 1,
      });
    } else {
        return NextResponse.json({ error: 'No plan or credit pack specified.' }, { status: 400 });
    }

    const sessionMetadata: Stripe.MetadataParam = {
      firebaseUID: user.uid,
    };
    if (sessionPlan) {
        sessionMetadata.plan = sessionPlan;
    }
    if (affiliateId) {
        sessionMetadata.affiliateId = affiliateId;
    }
     if (clientId) {
        sessionMetadata.clientId = clientId;
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items,
        mode: plan ? 'subscription' : 'payment',
        customer: customerId,
        success_url: `${origin}/dashboard?payment_success=true`,
        cancel_url: `${origin}/credits?payment_cancelled=true`,
        metadata: sessionMetadata,
    };
    
    if (coupon && coupons[coupon as keyof typeof coupons]) {
        try {
            // Find existing coupon or create one if it doesn't exist
            const existingCoupons = await stripe.coupons.list({ limit: 100 });
            let stripeCoupon = existingCoupons.data.find(c => c.name === coupon);
            
            if (!stripeCoupon) {
                 stripeCoupon = await stripe.coupons.create({
                    percent_off: 0, // Assuming coupons give credits, not discounts
                    name: coupon,
                    duration: 'once'
                });
            }
            sessionParams.discounts = [{ coupon: stripeCoupon.id }];

        } catch (couponError) {
            console.error("Stripe coupon error:", couponError);
            // Don't block checkout if coupon fails, just proceed without it
        }
    }


    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ sessionId: session.id });

  } catch (err: any) {
    console.error('Checkout API Error:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
