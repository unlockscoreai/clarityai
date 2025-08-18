
"use client";

import React, { useState, useEffect } from "react";
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
  UploadCloud,
  FileCheck,
  Mail,
} from "lucide-react";
import Link from "next/link";
import type { AnalyzeCreditProfileOutput } from '@/ai/flows/credit-report-analyzer';
import { useToast } from "@/hooks/use-toast";
import { getAuth, sendSignInLinkToEmail, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

type SignupStep = "upload" | "analyzing" | "preview";

function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.356-11.303-7.962H6.393C9.702,36.566,16.293,44,24,44z" />
        </svg>
    )
}

export function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState<SignupStep>("upload");
  const [reportFile, setReportFile] = useState<File | null>(null);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      console.error("Analysis failed:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Something went wrong while analyzing your report. Please try again.",
      });
      setStep("upload");
      setLoading(false);
    }
  }, [error, toast]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setReportFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!reportFile || !fullName || !email) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all fields and select a file to analyze.",
      });
      return;
    }
    setStep("analyzing");
    setLoading(true);
    setError(null);

    try {
      const auth = getAuth();
      const actionCodeSettings = {
        url: `${window.location.origin}/finish-signup`,
        handleCodeInApp: true,
      };

      // We need a token to call the backend. We send the sign-in link now,
      // store the user's details and analysis in localStorage, and then
      // create the full user record when they click the magic link.
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);

      const tempUser = auth.currentUser;
      if (!tempUser) {
        // This is tricky. signInWithEmailLink requires interaction.
        // For this flow, we will make the analysis endpoint public temporarily for signup
        // and secure it with a captcha or similar in a real app.
        // For now, we proceed without a token, which the backend will need to allow.
      }
      
      const idToken = tempUser ? await tempUser.getIdToken() : '';
      
      const formData = new FormData();
      formData.append('file', reportFile);
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: idToken ? { 'Authorization': `Bearer ${idToken}` } : {},
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned: ${response.status}: ${await response.text()}`);
      }

      const analysisResult: AnalyzeCreditProfileOutput & { fullName?: string } = await response.json();
      
      window.localStorage.setItem('emailForSignIn', email);
      analysisResult.fullName = fullName; 
      window.localStorage.setItem('analysisResult', JSON.stringify(analysisResult));

      setStep("preview");

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
             await setDoc(userDocRef, {
                fullName: user.displayName,
                email: user.email,
                subscription: { plan: 'starter', status: 'active', stripeSessionId: null },
                credits: 1,
                createdAt: serverTimestamp()
            });
             toast({ title: "Account Created!", description: "Welcome to Credit Clarity AI." });
        }
        
        router.push('/dashboard');

    } catch (error: any) {
        toast({ variant: "destructive", title: "Google Sign-Up Failed", description: error.message });
    } finally {
        setGoogleLoading(false);
    }
  }


  const renderStep = () => {
    switch (step) {
      case "upload":
        return (
          <>
            <CardHeader className="text-center">
                <CardTitle className="text-3xl font-headline font-bold text-primary">Get Your Free Analysis</CardTitle>
                <CardDescription className="font-body">
                    Upload your credit report to get started, or sign up with Google.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleAnalyze}>
                <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full font-bold" onClick={handleGoogleSignIn} disabled={loading || googleLoading}>
                        {googleLoading ? <Loader2 className="animate-spin" /> : <><GoogleIcon /> Sign Up with Google</>}
                    </Button>
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">OR UPLOAD A REPORT</span>
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

                    <Label htmlFor="report-upload" className="w-full cursor-pointer rounded-lg border-2 border-dashed border-muted-foreground/50 p-8 hover:bg-muted">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            {reportFile ? <FileCheck className="h-12 w-12 text-green-500" /> : <UploadCloud className="h-12 w-12" />}
                            <span>{reportFile ? reportFile.name : 'Click or drag to upload a PDF'}</span>
                        </div>
                    </Label>
                    <Input id="report-upload" type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                    <Button type="submit" disabled={!reportFile || !fullName || !email || loading || googleLoading} className="w-full font-bold">
                        {loading ? <Loader2 className="animate-spin" /> : "Analyze & Get Sign-In Link"}
                    </Button>
                </CardContent>
            </form>
          </>
        );
      case "analyzing":
        return (
            <CardContent className="flex flex-col items-center justify-center space-y-4 p-12">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <h2 className="text-2xl font-headline font-semibold">Analyzing Your Report...</h2>
                <p className="text-muted-foreground text-center">
                    Our AI is securely scanning your file. A sign-in link will be sent to your email once complete.
                </p>
            </CardContent>
        );
      case "preview":
        return (
            <>
                <CardHeader className="text-center">
                    <Mail className="mx-auto h-12 w-12 text-primary" />
                    <CardTitle className="text-3xl font-headline font-bold text-primary">Check Your Email!</CardTitle>
                    <CardDescription className="font-body">
                        A secure link to access your analysis and create your account has been sent to <strong>{email}</strong>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="text-center p-4 rounded-lg bg-background">
                         <p className="text-muted-foreground">Click the link in the email to securely sign in and view your full credit analysis.
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
