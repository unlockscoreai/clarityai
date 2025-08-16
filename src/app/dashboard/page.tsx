
"use client";

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import {
  ArrowUpRight,
  BadgeCent,
  FileText,
  Upload,
  Loader2,
  MailWarning,
} from "lucide-react";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/context/session-provider";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { AnalyzeCreditProfileOutput } from "@/ai/flows/credit-report-analyzer";
import { sendEmailVerification } from "firebase/auth";

function AnalyzeReportCard() {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { user } = useSession();
    const router = useRouter();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!user) {
            toast({ variant: "destructive", title: "Not Authenticated" });
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Server returned: ${response.status}: ${await response.text()}`);
            }

            const result: AnalyzeCreditProfileOutput = await response.json();

            // Save the analysis to Firestore
            const reportsCollectionRef = collection(db, "reports");
            await addDoc(reportsCollectionRef, {
                ...result,
                userId: user.uid,
                fileName: file.name,
                createdAt: serverTimestamp(),
            });

            toast({ title: 'Analysis Complete' });
            
            // Redirect to reports page with analysis data
            const params = new URLSearchParams();
            params.set('analysis', JSON.stringify(result));
            router.push(`/reports?${params.toString()}`);

        } catch (err: any) {
            console.error(err);
            toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: 'Something went wrong. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Card className="flex flex-col items-center justify-center text-center p-6 bg-card/50 relative">
            <label htmlFor="report-upload-dashboard" className="absolute inset-0 cursor-pointer">
                <span className="sr-only">Upload Report</span>
            </label>
            <input id="report-upload-dashboard" type="file" className="hidden" accept=".pdf" onChange={handleFileChange} disabled={loading}/>
            <CardHeader>
                <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary ${loading ? '' : 'animate-pulse'}`}>
                    {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8" />}
                </div>
                <CardTitle className="font-headline">{loading ? 'Analyzing...' : 'Analyze a New Report'}</CardTitle>
                <CardDescription>
                    {loading ? 'Your report is being processed.' : 'Upload your latest credit report PDF to get an updated analysis and find new opportunities.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild tabIndex={-1}>
                   <label htmlFor="report-upload-dashboard" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" /> Upload Report
                   </label>
                </Button>
            </CardContent>
        </Card>
    )
}

function EmailVerificationBanner() {
    const { user } = useSession();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    if (!user || user.emailVerified) {
        return null;
    }

    const handleResend = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await sendEmailVerification(user);
            toast({
                title: "Verification Email Sent",
                description: "A new verification link has been sent to your email address.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error Sending Email",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Alert variant="destructive" className="lg:col-span-2">
            <MailWarning className="h-4 w-4" />
            <AlertTitle>Verify Your Email Address</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
                Please check your inbox to verify your email. This is required to secure your account.
                <Button onClick={handleResend} variant="outline" size="sm" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin mr-2"/> : null}
                    Resend Verification
                </Button>
            </AlertDescription>
        </Alert>
    );
}

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <EmailVerificationBanner />
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Credit Score</CardDescription>
                <CardTitle className="text-4xl font-headline">720</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  +20 from last month
                </div>
              </CardContent>
              <CardFooter>
                <Progress value={72} aria-label="72% credit score" />
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Credits Remaining</CardDescription>
                <CardTitle className="text-4xl font-headline">3</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Renews in 15 days
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild size="sm" className="w-full">
                  <Link href="/credits">
                    <BadgeCent className="mr-2 h-4 w-4" /> Buy Credits
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Negative Items</CardDescription>
                <CardTitle className="text-4xl font-headline">4</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  2 disputes in progress
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/reports">
                    <FileText className="mr-2 h-4 w-4" /> View Report
                  </Link>
                </Button>
              </CardFooter>
            </Card>
             <Card>
              <CardHeader className="pb-2">
                <CardDescription>Affiliate Earnings</CardDescription>
                <CardTitle className="text-4xl font-headline">$125</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  +12% this month
                </div>
              </CardContent>
              <CardFooter>
                 <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/affiliate">
                    <ArrowUpRight className="mr-2 h-4 w-4" /> View Affiliate Stats
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Dispute Letters</CardTitle>
              <CardDescription>
                Track the status of your generated dispute letters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bureau</TableHead>
                    <TableHead>Date Generated</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Experian</TableCell>
                    <TableCell>2024-07-15</TableCell>
                    <TableCell className="text-right"><Badge variant="secondary">Mailed</Badge></TableCell>
                  </TableRow>
                   <TableRow>
                    <TableCell>Equifax</TableCell>
                    <TableCell>2024-07-10</TableCell>
                    <TableCell className="text-right"><Badge className="bg-accent text-accent-foreground hover:bg-accent/80">Delivered</Badge></TableCell>
                  </TableRow>
                   <TableRow>
                    <TableCell>TransUnion</TableCell>
                    <TableCell>2024-06-28</TableCell>
                    <TableCell className="text-right"><Badge className="bg-accent text-accent-foreground hover:bg-accent/80">Delivered</Badge></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            <AnalyzeReportCard />
        </div>
      </div>
    </AppLayout>
  );
}
