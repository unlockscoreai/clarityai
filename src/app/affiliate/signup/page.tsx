
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

export default function AffiliateSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      const uid = user.uid;

      // 2. Prepare affiliate data
      const affiliateData = {
        name,
        email,
        referrerId: null as string | null,
        clients: [],
        referrals: [],
        earnings: 0,
        credits: 1, // Initial credit bonus
        tier: 'Starter',
        createdAt: serverTimestamp(),
        referralLink: `https://creditclarity.ai/affiliate/signup?ref=${uid}`,
      };

      // 3. Handle referral logic
      if (referralCode) {
        const referrerRef = doc(db, "affiliates", referralCode);
        const referrerSnap = await getDoc(referrerRef);
        if (referrerSnap.exists()) {
          // Add new affiliate to referrer's list and give bonus
          await updateDoc(referrerRef, {
            referrals: arrayUnion(uid),
            credits: increment(1),
          });
          // Set referrerId for the new affiliate
          affiliateData.referrerId = referralCode;
        } else {
            toast({
                variant: "destructive",
                title: "Invalid Referral Code",
                description: "The referral code was not found, but your account will be created without it.",
            });
        }
      }

      // 4. Create affiliate record in Firestore with all data
      const affiliateRef = doc(db, "affiliates", uid);
      await setDoc(affiliateRef, affiliateData);

      toast({
        title: "Affiliate Account Created!",
        description: "Welcome! You're now ready to start.",
      });

      // 5. Redirect to affiliate dashboard
      router.push('/affiliate');

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-blue-100 dark:from-background dark:to-blue-950/20">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <form onSubmit={handleSubmit}>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline font-bold text-primary">
              Become an Affiliate
            </CardTitle>
            <CardDescription className="font-body">
              Join our network and start earning commissions today.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="referral">Referral Code (Optional)</Label>
              <Input id="referral" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} />
            </div>
            <Button type="submit" className="w-full font-bold" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Create Account"}
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
