
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AnalyzeCreditReportInput, AnalyzeCreditReportOutput } from '@/ai/flows/credit-report-analyzer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function fileToDataURI(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ReportsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeCreditReportOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select a credit report PDF to analyze.',
      });
      return;
    }
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const creditReportDataUri = await fileToDataURI(file);

      const input: AnalyzeCreditReportInput = {
        creditReportDataUri,
      };

      const response = await fetch('/api/flows/analyzeCreditReportFlow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`Server returned: ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      setAnalysis(result);
    } catch (err: any) {
      console.error(err);
      setError('Failed to analyze credit report.');
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Something went wrong. Please try again or use a different file.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 font-headline">Free Credit Analysis</h1>
      <p className="mb-4 text-muted-foreground">
        Upload your credit report for an AI-powered deep analysis of your credit profile, 
        with exact items to dispute and your personalized action plan.
      </p>

      <div className="mb-4 space-y-2">
        <Label htmlFor="reportFile">Upload Report</Label>
        <Input
          id="reportFile"
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <Button
        onClick={handleAnalyze}
        disabled={!file || loading}
      >
        {loading ? <><Loader2 className="mr-2 animate-spin" /> Analyzing...</> : 'Analyze Report'}
      </Button>

      {error && !analysis && <p className="text-red-500 mt-4">{error}</p>}

      {analysis && (
        <div className="mt-6 bg-card text-card-foreground p-6 rounded-xl shadow-md space-y-6">
          <h2 className="text-2xl font-bold border-b pb-2 font-headline">Your Credit Analysis</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Derogatory Items</p>
              <p className="text-2xl font-bold">{analysis.derogatoryCount ?? 0}</p>
            </div>
            <div className="bg-background p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Open Accounts</p>
              <p className="text-2xl font-bold">{analysis.openAccounts ?? 0}</p>
            </div>
            <div className="bg-background p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Hard Inquiries</p>
              <p className="text-2xl font-bold">{analysis.inquiryCount ?? 0}</p>
            </div>
            <div className="bg-background p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Accounts</p>
              <p className="text-2xl font-bold">{analysis.totalAccounts ?? 0}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mt-6 mb-3 font-headline">Items to Challenge</h3>
            {analysis.challengeItems?.length ? (
              <ul className="space-y-2">
                {analysis.challengeItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="bg-destructive/10 p-3 rounded-lg flex justify-between items-center"
                  >
                    <span className="text-destructive-foreground">{item.name} – {item.reason}</span>
                    <span className="font-bold text-destructive">
                      {item.successChance}%
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No items identified for dispute.</p>
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold mt-6 mb-3 font-headline">Personalized Action Plan</h3>
            <ul className="list-decimal pl-6 space-y-2 text-muted-foreground">
              {analysis.actionPlan?.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ul>
          </div>

          <div className="bg-primary/10 p-4 rounded-lg mt-6">
            <h3 className="text-lg font-bold text-primary mb-2">
              Unlock Your Full Credit Potential
            </h3>
            <p className="text-primary/90">
              Upgrade to unlock automated dispute letter generation, printing, and certified mailing.
              Take action now to remove negative items and boost your score faster.
            </p>
            <Button asChild className="mt-3">
                 <Link href="/credits">
                    View Plans
                 </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
