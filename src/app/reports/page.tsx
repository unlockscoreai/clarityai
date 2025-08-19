
'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import type { AnalyzeCreditProfileOutput } from '@/ai/flows/credit-report-analyzer';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/context/session-provider';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { AppLayout } from '@/components/app-layout';
import { useSearchParams } from 'next/navigation';
import CreditReportAnalysis from '@/components/reports/credit-report-analysis';

function ReportsPageContent() {
  const [loading, setLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeCreditProfileOutput | null>(null);
  const { user } = useSession();
  const searchParams = useSearchParams();

  useEffect(() => {
    const analysisData = searchParams.get('analysis');
    if (analysisData) {
      try {
        setAnalysisResult(JSON.parse(analysisData));
        setLoading(false);
      } catch (e) {
        console.error("Failed to parse analysis data from URL", e);
        // Fallback to fetching if parsing fails
        fetchLatestReport();
      }
    } else {
        fetchLatestReport();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user]);

  const fetchLatestReport = async () => {
    if (!user) {
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
        const reportQuery = query(
            collection(db, "reports"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc"),
        );
        const reportSnap = await getDocs(reportQuery);
        if (!reportSnap.empty) {
            setAnalysisResult(reportSnap.docs[0].data() as AnalyzeCreditProfileOutput);
        }
    } catch (error) {
        console.error("Error fetching latest report: ", error);
    } finally {
        setLoading(false);
    }
  }


  return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 font-headline">Credit Analysis</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-primary h-8 w-8" />
          </div>
        ) : analysisResult ? (
          <CreditReportAnalysis analysis={analysisResult} />
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
      <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-8 w-8" /></div>}>
        <ReportsPageContent />
      </Suspense>
    </AppLayout>
  )
}
