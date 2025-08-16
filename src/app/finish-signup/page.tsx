
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { AnalyzeCreditProfileOutput } from '@/ai/flows/credit-report-analyzer';
import { Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/app-layout';

export default function FinishSignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [message, setMessage] = useState('Verifying your link, please wait...');

  useEffect(() => {
    const auth = getAuth();
    const url = window.location.href;

    if (isSignInWithEmailLink(auth, url)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        // This is a fallback if local storage was cleared.
        email = window.prompt('Please provide your email for confirmation');
      }

      if (!email) {
        toast({ variant: 'destructive', title: 'Verification Failed', description: 'Email address not found.' });
        router.push('/signup');
        return;
      }
      
      const analysisJSON = window.localStorage.getItem('analysisResult');
      const analysis: AnalyzeCreditProfileOutput | null = analysisJSON ? JSON.parse(analysisJSON) : null;

      signInWithEmailLink(auth, email, url)
        .then(async (result) => {
          window.localStorage.removeItem('emailForSignIn');
          window.localStorage.removeItem('analysisResult');
          
          const user = result.user;
          const userDocRef = doc(db, 'users', user.uid);
          const isNewUser = !(await db.getDoc(userDocRef)).exists();

          if (isNewUser && analysis) {
            // This is a new user completing the signup flow
            setMessage('Welcome! Setting up your account...');
            const isTestUser = user.email === 'test@test.com';
            const plan = isTestUser ? 'vip' : 'starter';
            const credits = isTestUser ? 100 : 1;

            await setDoc(userDocRef, {
              fullName: analysis.fullName, // Assuming fullName is on analysis object
              email: user.email,
              subscription: { plan, status: 'active', stripeSessionId: null },
              credits,
              createdAt: serverTimestamp()
            });

            // Store report in Firestore
            const reportsCollectionRef = collection(db, "reports");
            await addDoc(reportsCollectionRef, {
                ...analysis,
                userId: user.uid,
                createdAt: serverTimestamp(),
            });

            toast({ title: "Account Created!", description: "Welcome to Credit Clarity AI." });
          } else {
            // This is an existing user logging in
            setMessage('Sign in successful! Redirecting...');
             toast({ title: "Welcome Back!", description: "You have been signed in." });
          }
          
          router.push('/dashboard');
        })
        .catch((error) => {
          console.error(error);
          toast({ variant: 'destructive', title: 'Sign In Failed', description: error.message });
          router.push('/login');
        });
    } else {
        setMessage('Invalid link. Please try signing in again.');
        router.push('/login');
    }
  }, [router, toast]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
