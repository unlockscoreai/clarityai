
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
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { runFlow } from '@genkit-ai/next/client';
import { AnalyzeCreditReportInput, AnalyzeCreditReportOutput } from '@/ai/flows/credit-report-analyzer';
import { useToast } from '@/hooks/use-toast';

function fileToDataURI(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function CreditReportUploader({ onAnalysisComplete }: { onAnalysisComplete: (analysis: AnalyzeCreditReportOutput) => void }) {
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setReportFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!reportFile) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a credit report PDF to analyze.",
      });
      return;
    }
    setLoading(true);

    try {
      const creditReportDataUri = await fileToDataURI(reportFile);
      // Note: We don't have user's full name and email here like in the signup form.
      // The flow is designed to handle this, but for a real app you might want to fetch user data.
      const input: AnalyzeCreditReportInput = { 
        creditReportDataUri,
        fullName: 'Current User',
        email: 'user@example.com'
      };
      
      const analysisResult = await runFlow<AnalyzeCreditReportOutput>('analyzeCreditReportFlow', input);

      onAnalysisComplete(analysisResult);

    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Something went wrong while analyzing your report. Please try again.",
      });
    } finally {
        setLoading(false);
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
