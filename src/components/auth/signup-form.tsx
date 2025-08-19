
"use client";

import { useState } from "react";
import { sendSignInLinkToEmail, GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { getActionCodeSettings } from "@/lib/firebaseConfig";
import AuthButtons from "./AuthButtons";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export default function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const isLoading = loadingEmail || loadingGoogle;

  const handleGoogleSignup = async () => {
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
    } catch (err: unknown) {
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
              errorMessage = `Sign-up failed: ${err.message} (Code: ${(err as any).code})`;
              break;
          }
        } else {
          errorMessage = err.message;
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      console.error("Google Signup Error:", errorMessage);
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: errorMessage,
      });
    } finally {
      setLoadingGoogle(false);
    }
  };


  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingEmail(true);
    try {
      const actionCodeSettings = getActionCodeSettings();
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      toast({
        title: "Check your email",
        description: "A sign-up link has been sent to your email address.",
      });
    } catch (error: any) {
      console.error("Email Signup Error:", error.message);
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message,
      });
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
      <form onSubmit={handleEmailSignup} className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="email-signup">Email Address</Label>
            <Input
              id="email-signup"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
        </div>
        <Button type="submit" disabled={isLoading} className="w-full">
            {loadingEmail ? <Loader2 className="animate-spin" /> : 'Continue with Email'}
        </Button>
      </form>
    </div>
  );
}
