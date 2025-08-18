
import Stripe from 'stripe';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// A map of coupon names to their credit values
const couponsToCreate = {
    'VIPFREE': { percent_off: 100, credits: 3, name: 'VIP First Month Free + 3 Credits' },
    'HALF50': { percent_off: 50, credits: 2, name: '50% Off Subscription + 2 Credits' },
    'SAVE20': { percent_off: 20, credits: 1, name: '20% Off Subscription + 1 Credit' }
};


async function createOrUpdateCoupons() {
  console.log('Syncing Stripe coupons...');
  
  try {
    const existingCoupons = await stripe.coupons.list({ limit: 100 });

    for (const [code, details] of Object.entries(couponsToCreate)) {
        const existingCoupon = existingCoupons.data.find(c => c.name === details.name);

        if (existingCoupon) {
            // Optionally update existing coupons if needed, for now we just log it
            console.log(`Coupon "${details.name}" already exists with ID: ${existingCoupon.id}. Skipping creation.`);
        } else {
            const coupon = await stripe.coupons.create({
                name: details.name,
                percent_off: details.percent_off,
                duration: 'once',
                id: code, // Use the code as the coupon ID for easy lookup
                metadata: {
                    credits: details.credits.toString(),
                },
            });
            console.log(`Created coupon "${coupon.name}" with ID: ${coupon.id}`);
        }
    }
     console.log('Successfully synced all coupons.');

  } catch (err) {
    console.error('Error creating coupons:', err);
  }
}

createOrUpdateCoupons();
