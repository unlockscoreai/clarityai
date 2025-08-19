
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { getAuth, sendSignInLinkToEmail, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";

type SignupStep = "start" | "email_sent";

function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.356-11.303-7.962H6.393C9.702,36.566,16.293,44,24,44z" />
s"
        </svg>
    )
}

export function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState<SignupStep>("start");
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleEmailSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!fullName || !email) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all fields.",
      });
      return;
    }
    setLoading(true);

    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/finish-signup`,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      
      window.localStorage.setItem('emailForSignIn', email);
      window.localStorage.setItem('fullNameForSignIn', fullName);

      setStep("email_sent");

    } catch (err: any) {
       toast({
        variant: "destructive",
        title: "Signup Failed",
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        router.push('/finish-signup');
    } catch (error: any) {
        toast({ variant: "destructive", title: "Google Sign-Up Failed", description: error.message });
        setGoogleLoading(false);
    }
  }


  const renderStep = () => {
    switch (step) {
      case "start":
        return (
          <>
            <CardHeader className="text-center">
                <CardTitle className="text-3xl font-headline font-bold text-primary">Get Your Free Analysis</CardTitle>
                <CardDescription className="font-body">
                    Sign up to access your personal credit analysis scanner for free.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleEmailSignup}>
                <CardContent className="space-y-4">
                    <Button variant="outline" type="button" className="w-full font-bold" onClick={handleGoogleSignIn} disabled={loading || googleLoading}>
                        {googleLoading ? <Loader2 className="animate-spin" /> : <><GoogleIcon /> Sign Up with Google</>}
                    </Button>
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">OR SIGN UP WITH EMAIL</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" placeholder="John Doe" required value={fullName} onChange={e => setFullName(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder="john@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <Button type="submit" disabled={!fullName || !email || loading || googleLoading} className="w-full font-bold">
                        {loading ? <Loader2 className="animate-spin" /> : "Send Sign-Up Link"}
                    </Button>
                </CardContent>
            </form>
          </>
        );
      case "email_sent":
        return (
            <>
                <CardHeader className="text-center">
                    <Mail className="mx-auto h-12 w-12 text-primary" />
                    <CardTitle className="text-3xl font-headline font-bold text-primary">Check Your Email!</CardTitle>
                    <CardDescription className="font-body">
                        A secure link to create your account has been sent to <strong>{email}</strong>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="text-center p-4 rounded-lg bg-background">
                         <p className="text-muted-foreground">Click the link in the email to securely sign in and start your credit journey.
                         </p>
                     </div>
                </CardContent>
            </>
        );
    }
  };

  return (
    <Card className="w-full max-w-lg shadow-2xl border-0">
      {renderStep()}
      <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
    </Card>
  );
}
