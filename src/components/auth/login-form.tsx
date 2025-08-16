
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getAuth, sendSignInLinkToEmail } from "firebase/auth";

const actionCodeSettings = {
  url: `${typeof window !== 'undefined' ? window.location.origin : ''}/finish-signup`,
  handleCodeInApp: true,
};

export function LoginForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const auth = getAuth();
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setEmailSent(true);
      toast({
        title: "Check your email",
        description: `A sign-in link has been sent to ${email}.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Could not send sign-in link.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-2xl border-0">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center mb-4">
            <div className="bg-primary rounded-full p-3">
                <svg className="h-8 w-8 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
            </div>
        </div>
        <h1 className="text-3xl font-headline font-bold text-primary">
          Credit Clarity AI
        </h1>
        <CardDescription className="font-body">
          {emailSent ? "Check Your Inbox" : "Welcome back! Sign in with a secure link."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {emailSent ? (
            <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
              <Mail className="mx-auto h-12 w-12 text-green-600" />
              <p className="mt-4 text-green-800">
                A secure sign-in link has been sent to <strong>{email}</strong>. Click the link in the email to sign in.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="name@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" className="w-full font-bold" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Send Sign-In Link"}
              </Button>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
