
"use client";

import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup, sendSignInLinkToEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import AuthButtons from "@/components/auth/AuthButtons";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";
import { getActionCodeSettings } from "@/lib/firebaseConfig";
import { Label } from "../ui/label";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const [loadingEmail, setLoadingEmail] = useState(false);

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
      console.error("Login Error:", err.message);
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
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="email-login">Email Address</Label>
            <Input
              id="email-login"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loadingEmail}
            />
        </div>
        <Button type="submit" disabled={loadingEmail} className="w-full">
            {loadingEmail ? <Loader2 className="animate-spin" /> : 'Continue with Email'}
        </Button>
      </form>
    </div>
  );
}
