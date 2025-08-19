
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
import { getAuth, sendSignInLinkToEmail, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";

const actionCodeSettings = {
  url: `${typeof window !== 'undefined' ? window.location.origin : ''}/finish-signup`,
  handleCodeInApp: true,
};

function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.356-11.303-7.962H6.393C9.702,36.566,16.293,44,24,44z" />
        </svg>
    )
}

export function LoginForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();
  
  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
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
  
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        router.push('/finish-signup');
    } catch (error: any) {
        toast({ variant: "destructive", title: "Google Sign-In Failed", description: error.message });
        setGoogleLoading(false);
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
          {emailSent ? "Check Your Inbox" : "Welcome back! Sign in to your account."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleEmailSubmit}>
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
              <Button type="submit" className="w-full font-bold" disabled={loading || googleLoading}>
                {loading ? <Loader2 className="animate-spin" /> : "Send Sign-In Link"}
              </Button>
               <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">OR</span>
                  </div>
                </div>

                <Button variant="outline" type="button" className="w-full font-bold" onClick={handleGoogleSignIn} disabled={loading || googleLoading}>
                   {googleLoading ? <Loader2 className="animate-spin" /> : <><GoogleIcon /> Sign in with Google</>}
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
