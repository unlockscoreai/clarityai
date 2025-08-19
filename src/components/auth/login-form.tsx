
"use client";

import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup, sendSignInLinkToEmail, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TestTube2 } from "lucide-react";
import AuthButtons from "@/components/auth/AuthButtons";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";
import { getActionCodeSettings } from "@/lib/firebaseConfig";
import { Label } from "../ui/label";
import { createUserIfNotExists } from "@/lib/firebase/firestoreUtils";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingEmail) return;
    setLoadingEmail(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/finish-signup');
    } catch (err: any) {
      console.error("Login Error:", err.message);
      toast({ variant: 'destructive', title: "Login Failed", description: err.message });
    } finally {
        setLoadingEmail(false);
    }
  };
  
  const handleDemoLogin = async () => {
    setLoadingDemo(true);
    try {
        await signInWithEmailAndPassword(auth, "demo@example.com", "password123");
        router.push("/dashboard");
        toast({ title: "Demo User Logged In", description: "Welcome! Feel free to explore the application." });
    } catch (error: any) {
        console.error("Demo Login Error:", error);
        toast({ 
            variant: "destructive", 
            title: "Demo Login Failed", 
            description: "Please ensure the demo user (demo@example.com) has been created in your Firebase Authentication console with the password 'password123'." 
        });
    } finally {
        setLoadingDemo(false);
    }
  }

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
        <div className="space-y-2">
            <Label htmlFor="password-login">Password</Label>
            <Input
              id="password-login"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loadingEmail}
            />
        </div>
        <Button type="submit" disabled={loadingEmail || loadingDemo} className="w-full">
            {loadingEmail ? <Loader2 className="animate-spin" /> : 'Continue with Email'}
        </Button>
      </form>
       <Button variant="outline" onClick={handleDemoLogin} disabled={loadingDemo || loadingEmail} className="w-full">
         {loadingDemo ? <Loader2 className="animate-spin" /> : <TestTube2 />}
         Login as Demo User
       </Button>
    </div>
  );
}
