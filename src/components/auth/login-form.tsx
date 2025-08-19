
"use client";

import { useState } from "react";
import { getAuth, GoogleAuthProvider, signInWithPopup, sendSignInLinkToEmail } from "firebase/auth";
import { getActionCodeSettings } from "@/lib/firebaseConfig";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import AuthButtons from "@/components/auth/AuthButtons";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const router = useRouter();
  const auth = getAuth();
  const { toast } = useToast();
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user) {
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date(),
        }, { merge: true });
      }
      
      router.push("/finish-signup");
    } catch (err: any) {
        let errorMessage = "An unexpected error occurred.";
        if (err instanceof Error) {
            if ((err as any).code) {
                switch ((err as any).code) {
                    case 'auth/popup-closed-by-user':
                        errorMessage = "You closed the Google sign-in window. Please try again.";
                        break;
                    case 'auth/cancelled-popup-request':
                        errorMessage = "Sign-in cancelled. Another sign-in request is already in progress.";
                        break;
                    case 'auth/account-exists-with-different-credential':
                        errorMessage = 'An account already exists with this email. Please sign in using the original method.';
                        break;
                    default:
                        errorMessage = `Login failed: ${err.message} (Code: ${(err as any).code})`;
                        break;
                }
            } else {
                errorMessage = err.message;
            }
        }
      console.error(err.message);
      toast({ variant: 'destructive', title: "Login Failed", description: errorMessage });
    } finally {
        setLoadingGoogle(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingEmail) return;
    setLoadingEmail(true);

    try {
      const actionCodeSettings = getActionCodeSettings();
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      toast({ title: 'Check your email for the login link!' });
    } catch (err: any) {
      console.error(err.message);
      toast({ variant: 'destructive', title: "Login Failed", description: err.message });
    } finally {
        setLoadingEmail(false);
    }
  };

  return (
    <div className="space-y-4">
      <AuthButtons />
      <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">OR</span>
          </div>
        </div>
      <form onSubmit={handleEmailLogin} className="flex gap-2">
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loadingEmail}
        />
        <Button type="submit" disabled={loadingEmail}>
            {loadingEmail ? <Loader2 className="animate-spin" /> : 'Send Link'}
        </Button>
      </form>
    </div>
  );
}
