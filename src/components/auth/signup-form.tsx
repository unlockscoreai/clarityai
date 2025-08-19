
"use client";

import { useState } from "react";
import { sendSignInLinkToEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { getActionCodeSettings } from "@/lib/firebaseConfig";
import AuthButtons from "./AuthButtons";

export default function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const isLoading = loadingEmail;

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
