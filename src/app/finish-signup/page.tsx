
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { isSignInWithEmailLink, signInWithEmailLink, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Loader2 } from 'lucide-react';
import { createUserIfNotExists } from '@/lib/firebase/firestoreUtils';


export default function FinishSignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [message, setMessage] = useState('Verifying your session, please wait...');

  useEffect(() => {
    // This function handles creating the user doc in Firestore if it doesn't exist.
    const handleUserFinalization = async (user: User) => {
        try {
            setMessage('Finalizing account setup...');
            await createUserIfNotExists(user);
            setMessage('Redirecting to your dashboard...');
            router.push('/dashboard');
        } catch (error: any) {
            console.error("Error during user finalization:", error);
            toast({ variant: 'destructive', title: 'Setup Failed', description: error.message });
            router.push('/signup'); // Redirect back to signup on failure
        }
    };

    // Case 1: User is returning from an email link sign-in
    if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
          // This can happen if the user opens the link on a different browser.
          email = window.prompt('Please provide your email for confirmation');
        }

        if (email) {
            setMessage('Finalizing email sign in...');
            signInWithEmailLink(auth, email, window.location.href)
              .then(async (result) => {
                window.localStorage.removeItem('emailForSignIn');
                await handleUserFinalization(result.user);
              })
              .catch((error) => {
                console.error("Email link sign in error:", error);
                toast({ variant: 'destructive', title: 'Sign In Failed', description: error.message });
                router.push('/login');
              });
        } else {
             toast({ variant: 'destructive', title: 'Verification Failed', description: 'Email address not found. Please try signing in again.' });
             router.push('/login');
        }

    } else {
        // Case 2: User is returning from Google sign-in or is already logged in
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is logged in, ensure their doc exists and redirect.
                handleUserFinalization(user);
            } else {
                // No user found, maybe they navigated here by mistake.
                setMessage('No user session found. Please sign in.');
                setTimeout(() => router.push('/login'), 3000);
            }
            unsubscribe(); // Clean up listener after first check
        });

        // Cleanup function for the effect
        return () => unsubscribe();
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
