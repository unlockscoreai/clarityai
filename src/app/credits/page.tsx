
"use client";

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, Loader2, Gift } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/context/session-provider";
import { useToast } from "@/hooks/use-toast";
import { getStripe } from "@/lib/stripe-client";
import { coupons } from "@/lib/coupons";

const subscriptionPlans = [
    {
        name: "Starter",
        price: "$49",
        credits: "1 credit/month",
        features: ["Personal analysis scan", "Dashboard access", "Buy additional credits"],
        isCurrent: true,
    },
    {
        name: "Pro",
        price: "$99",
        credits: "3 credits/month",
        features: ["Priority letter processing", "Discounted credit packs", "All Starter features"],
        isCurrent: false,
    },
    {
        name: "VIP",
        price: "$199",
        credits: "10 credits/month",
        features: ["White-glove mailing support", "Monthly 1-on-1 strategy call", "Best discount on credit packs"],
        isCurrent: false,
    }
]

const creditPacks = [
    { credits: 1, price: 15 },
    { credits: 3, price: 45 },
    { credits: 5, price: 70 },
    { credits: 10, price: 135 },
    { credits: 15, price: 199 },
    { credits: 20, price: 260 },
]

export default function CreditsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [bonusInfo, setBonusInfo] = useState<{ credits: number; description: string } | null>(null);
  const { user } = useSession();
  const { toast } = useToast();
  
  const handleCouponChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase();
    setCouponCode(code);

    const couponData = coupons[code as keyof typeof coupons];
    if (couponData) {
      setBonusInfo(couponData);
    } else {
      setBonusInfo(null);
    }
  };


  const handleCheckout = async (item: {name: string, price: string, credits: string} | {credits: number, price: number}) => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Not Authenticated",
            description: "You must be logged in to make a purchase."
        });
        return;
    }

    const itemIdentifier = 'name' in item ? item.name : `credits-${item.credits}`;
    setLoading(itemIdentifier);

    try {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                plan: 'name' in item ? item : null,
                credits: 'credits' in item && !('name' in item) ? item : null,
                coupon: couponCode,
                user: {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                }
            })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Checkout failed");
        }

        const { sessionId } = await res.json();
        const stripe = await getStripe();
        if (!stripe) {
            throw new Error("Stripe.js failed to load.");
        }
        await stripe.redirectToCheckout({ sessionId });

    } catch (err: any) {
         toast({
            variant: "destructive",
            title: "Payment Error",
            description: err.message || "Something went wrong. Please try again."
        });
    } finally {
        setLoading(null);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-12">
        <div>
          <h1 className="text-3xl font-headline font-bold">Credits & Plans</h1>
          <p className="text-muted-foreground">
            Manage your subscription and purchase additional credits.
          </p>
        </div>

        <section>
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Have a Coupon?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="coupon">Coupon Code</Label>
                <Input
                  id="coupon"
                  placeholder="Enter code here"
                  value={couponCode}
                  onChange={handleCouponChange}
                  className="uppercase"
                />
              </div>
              {bonusInfo && (
                <Alert className="bg-accent/10 border-accent/50 text-accent-foreground">
                  <Gift className="h-4 w-4 text-accent" />
                  <AlertTitle className="text-accent font-bold">Coupon Applied!</AlertTitle>
                  <AlertDescription>
                    {bonusInfo.description}. You’ll receive {bonusInfo.credits} bonus credits!
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </section>


        <section>
            <h2 className="text-2xl font-headline font-semibold mb-4">Subscription Plans</h2>
             <div className="grid gap-6 md:grid-cols-3">
                {subscriptionPlans.map(plan => (
                    <Card key={plan.name} className={`flex flex-col ${plan.isCurrent ? 'border-primary' : ''}`}>
                        <CardHeader>
                            <CardTitle className="font-headline">{plan.name}</CardTitle>
                            <CardDescription>{plan.credits}</CardDescription>
                            <p className="text-4xl font-bold">{plan.price}<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-2">
                            {plan.features.map(feature => (
                                <div key={feature} className="flex items-start gap-2">
                                    <Check className="h-5 w-5 text-accent mt-1 shrink-0" />
                                    <span className="text-sm">{feature}</span>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter>
                            <Button 
                                className="w-full font-bold" 
                                disabled={plan.isCurrent || loading !== null} 
                                onClick={() => handleCheckout(plan)}
                            >
                                {loading === plan.name ? <Loader2 className="animate-spin" /> : plan.isCurrent ? "Current Plan" : "Upgrade Plan"}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
             </div>
        </section>

         <section>
            <h2 className="text-2xl font-headline font-semibold mb-4">Purchase Credit Packs</h2>
             <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
                {creditPacks.map(pack => (
                    <Card key={pack.credits} className="text-center">
                        <CardHeader>
                            <CardTitle className="font-headline">{pack.credits} Credit{pack.credits > 1 ? 's' : ''}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">${pack.price}</p>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                variant="outline" 
                                className="w-full" 
                                disabled={loading !== null} 
                                onClick={() => handleCheckout(pack)}
                            >
                                {loading === `credits-${pack.credits}` ? <Loader2 className="animate-spin" /> : 'Buy Now'}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
             </div>
        </section>

      </div>
    </AppLayout>
  );
}
