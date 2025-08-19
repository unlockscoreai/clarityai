
'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import AuthButtons from '@/components/auth/AuthButtons';

// This is the main page component that renders the Suspense boundary
export default function AffiliateSignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AffiliateSignupContent />
    </Suspense>
  );
}

function AffiliateSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // New user
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName || '',
          email: user.email,
          createdAt: serverTimestamp(),
          credits: 1, // Welcome credit
          subscription: { plan: 'starter', status: 'active' },
          roles: ['affiliate']
        });
        toast({
          title: 'Account created!',
          description: 'Welcome to Credit Clarity AI.',
        });

        // Handle referral if code is present
        if (referralCode) {
            const referrerRef = doc(db, "users", referralCode);
            const referrerSnap = await getDoc(referrerRef);
            if (referrerSnap.exists()) {
                await updateDoc(referrerRef, {
                    referrals: arrayUnion(user.uid),
                    credits: increment(1) // Bonus for referrer
                });
            }
        }

      } else {
         // Existing user, ensure they have affiliate role
         await updateDoc(userRef, {
            roles: arrayUnion('affiliate')
         });
         toast({
            title: 'Signed in successfully!',
            description: 'Your account is now enabled for affiliate access.',
        });
      }

      router.push('/affiliate');
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      toast({
        variant: 'destructive',
        title: 'Sign-in Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-blue-100 dark:from-background dark:to-blue-950/20">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline font-bold text-primary">
            Join the Affiliate Program
          </CardTitle>
          <CardDescription className="font-body">
            Sign up or sign in to become an affiliate partner.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="referral">Referral Code (Optional)</Label>
            <Input
              id="referral"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="Enter referral code"
            />
          </div>
          <AuthButtons />
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            By signing up, you agree to our{' '}
            <Link href="#" className="font-medium text-primary hover:underline">
              Affiliate Terms
            </Link>
            .
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
