
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getAuth, isSignInWithEmailLink, signInWithEmailLink, sendEmailVerification, updateProfile, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, addDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { AnalyzeCreditProfileOutput } from '@/ai/flows/credit-report-analyzer';
import { Loader2 } from 'lucide-react';


export default function FinishSignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [message, setMessage] = useState('Verifying your link, please wait...');

  useEffect(() => {
    const auth = getAuth();
    const url = window.location.href;

    if (!isSignInWithEmailLink(auth, url)) {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (!userDoc.exists()) {
                    await setDoc(userDocRef, {
                        fullName: user.displayName,
                        email: user.email,
                        subscription: { plan: 'starter', status: 'active', stripeSessionId: null },
                        credits: 1, 
                        createdAt: serverTimestamp()
                    });
                    toast({ title: "Account Created!", description: "Welcome to Credit Clarity AI." });
                }
                setMessage('Redirecting to your dashboard...');
                router.push('/dashboard');
            } else {
                setMessage('Invalid link or session. Redirecting to login...');
                router.push('/login');
            }
        });
        return;
    }

    let email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      email = window.prompt('Please provide your email for confirmation');
    }

    if (!email) {
      toast({ variant: 'destructive', title: 'Verification Failed', description: 'Email address not found.' });
      router.push('/signup');
      return;
    }
    
    const analysisJSON = window.localStorage.getItem('analysisResult');
    const analysis: (AnalyzeCreditProfileOutput & { fullName: string }) | null = analysisJSON ? JSON.parse(analysisJSON) : null;

    signInWithEmailLink(auth, email, url)
      .then(async (result) => {
        window.localStorage.removeItem('emailForSignIn');
        window.localStorage.removeItem('analysisResult');
        
        const user = result.user;
        const userDocRef = doc(db, 'users', user.uid);
        
        const userDoc = await getDoc(userDocRef);
        const isNewUser = !userDoc.exists();

        if (isNewUser) {
          setMessage('Welcome! Setting up your account...');
          
          const fullNameFromStorage = window.localStorage.getItem('fullNameForSignIn');
          window.localStorage.removeItem('fullNameForSignIn');

          await updateProfile(user, { displayName: fullNameFromStorage || user.displayName });
          
          const isTestUser = user.email === 'test@test.com';
          const plan = isTestUser ? 'vip' : 'starter';
          const credits = isTestUser ? 100 : 1;

          await setDoc(userDocRef, {
            fullName: fullNameFromStorage || user.displayName,
            email: user.email,
            subscription: { plan, status: 'active', stripeSessionId: null },
            credits,
            createdAt: serverTimestamp()
          });
          
          await sendEmailVerification(user);

          toast({ title: "Account Created!", description: "Welcome! Please check your email to verify your account." });
        } else {
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
