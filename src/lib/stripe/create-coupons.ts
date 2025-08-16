
import Stripe from 'stripe';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

async function createCoupons() {
  console.log('Creating Stripe coupons...');
  try {
    // VIP: First month free + 3 credits
    const vipCoupon = await stripe.coupons.create({
      name: 'VIP First Month Free + 3 Credits',
      percent_off: 100,
      duration: 'once',
      metadata: {
        credits: '3',
      },
    });
    console.log('Created VIP Coupon:', vipCoupon.id);

    // 50% off + 2 credits
    const halfOffCoupon = await stripe.coupons.create({
      name: '50% Off Subscription + 2 Credits',
      percent_off: 50,
      duration: 'once',
      metadata: {
        credits: '2',
      },
    });
    console.log('Created 50% Off Coupon:', halfOffCoupon.id);

    // 20% off + 1 credit
    const twentyOffCoupon = await stripe.coupons.create({
      name: '20% Off Subscription + 1 Credit',
      percent_off: 20,
      duration: 'once',
      metadata: {
        credits: '1',
      },
    });
    console.log('Created 20% Off Coupon:', twentyOffCoupon.id);

    console.log('Successfully created all coupons.');

  } catch (err) {
    console.error('Error creating coupons:', err);
  }
}

createCoupons();
