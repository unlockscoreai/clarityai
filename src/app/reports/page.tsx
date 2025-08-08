
'use client';

import { AppLayout } from '@/components/app-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FileText,
  Loader2,
  UploadCloud,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React, { useState, useMemo } from 'react';
import { useStreamFlow } from '@genkit-ai/next/client';
import { analyzeCreditReport, AnalyzeCreditReportInput, AnalyzeCreditReportOutput } from '@/ai/flows/credit-report-analyzer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function CreditReportUploader({ onAnalysisComplete }: { onAnalysisComplete: (analysis: AnalyzeCreditReportOutput) => void }) {
  const [reportFile, setReportFile] = useState<File | null>(null);
  const { stream, start, loading } = useStreamFlow(analyzeCreditReport);

  const analysis = useMemo(() => {
    let lastPiece: AnalyzeCreditReportOutput | undefined;
    for (const piece of stream) {
      if (piece.output) {
        lastPiece = piece.output;
      }
    }
    return lastPiece;
  }, [stream]);

  React.useEffect(() => {
    if (analysis) {
      onAnalysisComplete(analysis);
    }
  }, [analysis, onAnalysisComplete]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setReportFile(e.target.files[0]);
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (!reportFile) {
      console.error("No report file selected");
      return;
    }
    try {
      const creditReportDataUri = await fileToDataUri(reportFile);
      const input: AnalyzeCreditReportInput = { creditReportDataUri };
      start(input);
    } catch (error) {
      console.error("Analysis failed:", error);
    }
  };

  return (
    <Card className="text-center">
      <CardHeader>
        <CardTitle>Upload New Credit Report</CardTitle>
        <CardDescription>Upload a new PDF to get an up-to-date analysis of your credit.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <Label htmlFor="report-upload" className="w-full cursor-pointer rounded-lg border-2 border-dashed border-muted-foreground/50 p-8 hover:bg-muted">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <UploadCloud className="h-12 w-12" />
            <span>{reportFile ? reportFile.name : 'Click or drag to upload a PDF'}</span>
          </div>
        </Label>
        <Input id="report-upload" type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
        <Button onClick={handleUpload} disabled={!reportFile || loading} className="w-full font-bold">
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</> : 'Analyze Report'}
        </Button>
      </CardContent>
    </Card>
  );
}


function AnalysisDisplay({ analysis }: { analysis: AnalyzeCreditReportOutput | null }) {
  if (!analysis) {
    // This could be a welcome message or an empty state.
    return (
       <Card>
            <CardHeader>
                <CardTitle>Your Credit Analysis</CardTitle>
                <CardDescription>Upload a credit report to get started.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Once you upload a report, your detailed analysis will appear here.</p>
            </CardContent>
       </Card>
    )
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Your Credit Analysis</CardTitle>
            <CardDescription>Generated on: {new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: analysis.analysisHtml }} />
             <section id="items-to-challenge">
                <h2 className="text-xl font-semibold font-headline my-4">Items We Recommend Challenging</h2>
                <Button asChild>
                    <Link href="/disputes">
                        <FileText className="mr-2"/>
                        Go to Dispute Center
                    </Link>
                </Button>
            </section>
        </CardContent>
    </Card>
  )
}

export default function CreditAnalysisPage() {
  const [analysis, setAnalysis] = useState<AnalyzeCreditReportOutput | null>(null);

  const handleAnalysisComplete = (newAnalysis: AnalyzeCreditReportOutput) => {
    setAnalysis(newAnalysis);
  };

  return (
    <AppLayout>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <CreditReportUploader onAnalysisComplete={handleAnalysisComplete} />
        </div>
        <div className="md:col-span-2">
            <AnalysisDisplay analysis={analysis} />
        </div>
      </div>
    </AppLayout>
  );
}
