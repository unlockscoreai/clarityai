
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { isSignInWithEmailLink, signInWithEmailLink, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { Loader2 } from 'lucide-react';


export default function FinishSignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [message, setMessage] = useState('Verifying your link, please wait...');

  useEffect(() => {
    const url = window.location.href;

    // This function handles creating the user doc in Firestore if it doesn't exist.
    const handleUserCreation = async (user: import('firebase/auth').User) => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            setMessage('Welcome! Setting up your account...');
            const isTestUser = user.email === 'test@test.com';
            const plan = isTestUser ? 'vip' : 'starter';
            const credits = isTestUser ? 100 : 1;

            await setDoc(userDocRef, {
                uid: user.uid,
                name: user.displayName || '',
                email: user.email,
                createdAt: serverTimestamp(),
                credits: credits,
                subscription: { plan: plan, status: 'active' },
            });
            toast({ title: "Account Created!", description: "Welcome to Credit Clarity AI." });
        } else {
            toast({ title: "Welcome Back!", description: "You have been signed in." });
        }
        
        setMessage('Redirecting to your dashboard...');
        router.push('/dashboard');
    };

    if (isSignInWithEmailLink(auth, url)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
          email = window.prompt('Please provide your email for confirmation');
        }

        if (!email) {
          toast({ variant: 'destructive', title: 'Verification Failed', description: 'Email address not found.' });
          router.push('/signup');
          return;
        }

        signInWithEmailLink(auth, email, url)
          .then(async (result) => {
            window.localStorage.removeItem('emailForSignIn');
            await handleUserCreation(result.user);
          })
          .catch((error) => {
            console.error(error);
            toast({ variant: 'destructive', title: 'Sign In Failed', description: error.message });
            router.push('/login');
          });
    } else {
        // Handle Google sign-in redirect or if user is already signed in
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                handleUserCreation(user);
            } else {
                setMessage('No user session found. Redirecting to login...');
                setTimeout(() => router.push('/login'), 2000);
            }
            unsubscribe(); // Clean up listener
        });
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
