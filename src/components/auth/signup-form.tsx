
"use client";

import React, { useState, useMemo } from "react";
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
  Lock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { runFlow } from '@genkit-ai/next/client';
import type { AnalyzeCreditReportInput, AnalyzeCreditReportOutput } from '@/ai/flows/credit-report-analyzer';
import { useToast } from "@/hooks/use-toast";

type SignupStep = "upload" | "analyzing" | "preview" | "create_account";

function fileToDataURI(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function AnalysisPreview({ htmlContent }: { htmlContent: string }) {
    const previewContent = useMemo(() => {
        // Creates a temporary div to parse the HTML string
        const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
        // We'll take the first 3 sections as a preview
        const sections = Array.from(doc.querySelectorAll('body > *')).slice(0, 3);
        return sections.map(el => el.outerHTML).join('');
    }, [htmlContent]);

    return <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: previewContent }} />;
}


export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<SignupStep>("upload");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeCreditReportOutput | null>(null);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


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

    try {
      const creditReportDataUri = await fileToDataURI(reportFile);
      const input: AnalyzeCreditReportInput = { 
          creditReportDataUri,
          fullName,
          email
      };
      
      const analysisResult = await runFlow<AnalyzeCreditReportOutput>('analyzeCreditReport', input);
      
      setAnalysis(analysisResult);
      setStep("preview");

    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Something went wrong while analyzing your report. Please try again.",
      });
      setStep("upload");
    }
  };

  const handleCreateAccount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // In a real app, this would handle account creation
    toast({
        title: "Account Created!",
        description: "Welcome to Credit Clarity AI. Your full report is now available.",
    });
    router.push('/dashboard');
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
                    <Button type="submit" disabled={!reportFile || !fullName || !email} className="w-full font-bold">
                        Analyze My Report
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
                    Our AI is securely scanning your file to find opportunities. This may take a moment.
                </p>
            </CardContent>
        );
      case "preview":
        return (
            <>
                <CardHeader>
                    <CardTitle className="text-3xl font-headline font-bold text-primary">Your Analysis is Ready!</CardTitle>
                    <CardDescription className="font-body">
                        Here's a preview. Create an account to unlock your full report and credit boosters.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {analysis && <AnalysisPreview htmlContent={analysis.analysisHtml} />}
                    <div className="relative mt-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Unlock Full Report</span>
                        </div>
                    </div>
                     <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-lg border bg-slate-50/50 p-4 text-center dark:bg-slate-800/20">
                        <Lock className="h-8 w-8 text-primary" />
                        <p className="font-semibold">Create your account to continue.</p>
                        <Button onClick={() => setStep('create_account')} className="w-full font-bold">
                            Create Account & View Full Report
                        </Button>
                    </div>
                </CardContent>
            </>
        );
      case "create_account":
        return (
            <>
                <CardHeader>
                    <CardTitle className="text-3xl font-headline font-bold text-primary">Almost there!</CardTitle>
                    <CardDescription className="font-body">
                        Create your account to save your analysis and start improving your credit.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleCreateAccount}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" value={fullName} required readOnly disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={email} required readOnly disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                        <Button type="submit" className="w-full font-bold">
                            Create Account
                        </Button>
                    </CardContent>
                </form>
            </>
        )
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
