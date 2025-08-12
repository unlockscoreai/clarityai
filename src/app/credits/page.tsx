
"use client";

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/context/session-provider";
import { useToast } from "@/hooks/use-toast";
import { getStripe } from "@/lib/stripe-client";

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
  const { user } = useSession();
  const { toast } = useToast();

  const handleCheckout = async (item: {name: string, price: string} | {credits: number, price: number}) => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Not Authenticated",
            description: "You must be logged in to make a purchase."
        });
        return;
    }

    const { name, credits, price } = 'name' in item ? {name: item.name, credits: item.credits, price: item.price} : {name: null, credits: item.credits, price: `$${item.price}`};
    setLoading(name || `credits-${credits}`);

    try {
        const token = await user.getIdToken();
        const res = await fetch('/api/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify('name' in item ? { plan: item } : { credits: item }),
        });

        const { sessionId } = await res.json();
        if (!sessionId) {
            throw new Error("Could not create checkout session");
        }
        
        const stripe = await getStripe();
        const { error } = await stripe!.redirectToCheckout({ sessionId });

        if (error) {
            throw error;
        }

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
