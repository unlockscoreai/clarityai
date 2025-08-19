
'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import type { AnalyzeCreditProfileOutput } from '@/ai/flows/credit-report-analyzer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, ShieldQuestion, FileHeart, CheckCircle, ArrowUpRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/context/session-provider';
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSearchParams } from 'next/navigation';

function AnalysisDisplay({ analysis }: { analysis: AnalyzeCreditProfileOutput }) {
  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <FileHeart className="h-6 w-6 text-primary" />
            Your Credit Analysis
          </CardTitle>
          <CardDescription>
            This AI-powered analysis is based on your uploaded credit report. 
            Follow these steps to improve your score.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="default">
            <AlertTitle>Analysis Summary</AlertTitle>
            <AlertDescription>{analysis.summary}</AlertDescription>
          </Alert>

          <div>
            <h3 className="text-lg font-semibold mb-4">Score Breakdown by Factor</h3>
            <div className="space-y-4">
              {analysis.factors.map((factor, index) => (
                <div key={index} className="flex flex-col p-4 border rounded-md space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{factor.title}</span>
                    <span className="text-green-600 text-sm flex items-center gap-1">
                      {factor.impact} <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="text-muted-foreground">{factor.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Your Personalized Action Plan</h3>
            <div className="space-y-4">
              {analysis.actionItems.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1 shrink-0" />
                  <p className="text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>


      <Card>
          <CardHeader>
              <CardTitle className="font-headline flex items-center"><ShieldQuestion className="mr-2 text-primary"/>Ready to take action?</CardTitle>
              <CardDescription>Use our AI to generate professional dispute letters for the negative items found on your report.</CardDescription>
          </CardHeader>
           <CardContent>
              <Button asChild>
                <Link href="/letters">
                    Go to Letter Center <ArrowUpRight className="ml-2"/>
                </Link>
              </Button>
          </CardContent>
      </Card>
    </div>
  );
}


function ReportsPageContent() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeCreditProfileOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useSession();
  const searchParams = useSearchParams();

  useEffect(() => {
    const analysisData = searchParams.get('analysis');
    if (analysisData) {
      try {
        setAnalysisResult(JSON.parse(analysisData));
      } catch (e) {
        console.error("Failed to parse analysis data from URL", e);
      }
    } else if (user) {
        // If no analysis in URL, fetch the latest one for the user
        const fetchLatestReport = async () => {
            setLoading(true);
            const reportQuery = query(
                collection(db, "reports"),
                where("userId", "==", user.uid),
                orderBy("createdAt", "desc"),
            );
            const reportSnap = await getDocs(reportQuery);
            if (!reportSnap.empty) {
                setAnalysisResult(reportSnap.docs[0].data() as AnalyzeCreditProfileOutput);
            }
            setLoading(false);
        }
        fetchLatestReport();
    }
  }, [searchParams, user]);


  return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 font-headline">Credit Analysis</h1>
        
        {loading && !analysisResult ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : analysisResult ? (
          <AnalysisDisplay analysis={analysisResult} />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold">No analysis found.</h2>
            <p className="text-muted-foreground mt-2">Get started by analyzing your credit report from the dashboard.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        )}
        
      </div>
  );
}


export default function ReportsPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>}>
        <ReportsPageContent />
      </Suspense>
    </AppLayout>
  )
}

    