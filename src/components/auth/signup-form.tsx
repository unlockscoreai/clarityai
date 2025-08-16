
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
import { getAuth, sendSignInLinkToEmail } from "firebase/auth";

type SignupStep = "upload" | "analyzing" | "preview";

export function SignupForm() {
  const { toast } = useToast();

  const [step, setStep] = useState<SignupStep>("upload");
  const [reportFile, setReportFile] = useState<File | null>(null);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);
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
      const formData = new FormData();
      formData.append('file', reportFile);
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned: ${response.status}: ${await response.text()}`);
      }

      const analysisResult: AnalyzeCreditProfileOutput & { fullName?: string } = await response.json();
      
      // Send sign-in link
      const auth = getAuth();
      const actionCodeSettings = {
        url: `${window.location.origin}/finish-signup`,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);

      // Store email and analysis results in local storage to be picked up after verification
      window.localStorage.setItem('emailForSignIn', email);
      analysisResult.fullName = fullName; // Add fullName to the object
      window.localStorage.setItem('analysisResult', JSON.stringify(analysisResult));

      setStep("preview");

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const renderStep = () => {
    switch (step) {
      case "upload":
        return (
          <>
            <CardHeader className="text-center">
                <CardTitle className="text-3xl font-headline font-bold text-primary">Get Your Free Analysis</CardTitle>
                <CardDescription className="font-body">
                    Upload your credit report to get started. We'll give you a personalized analysis in minutes.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleAnalyze}>
                <CardContent className="space-y-4">
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
                    <Button type="submit" disabled={!reportFile || !fullName || !email || loading} className="w-full font-bold">
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
