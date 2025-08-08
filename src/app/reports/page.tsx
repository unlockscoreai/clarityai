
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
  Upload,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRunFlow } from '@genkit-ai/next/use-flow';
import { analyzeCreditReport } from '@/ai/flows/credit-report-analyzer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

function CreditReportUploader({
  onAnalysisComplete,
}: {
  onAnalysisComplete: (html: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const { run, loading, error } = useRunFlow(analyzeCreditReport);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please upload your credit report PDF.',
      });
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const creditReportDataUri = reader.result as string;
      const result = await run({ creditReportDataUri });
      if (result?.analysisHtml) {
        onAnalysisComplete(result.analysisHtml);
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      toast({
        variant: 'destructive',
        title: 'File Read Error',
        description: 'Could not read the selected file.',
      });
    };
  };

  if (error) {
    toast({
      variant: 'destructive',
      title: 'Analysis Failed',
      description: error.message,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Your Credit Report</CardTitle>
        <CardDescription>
          Upload your latest credit report PDF to get an updated analysis.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="credit-report">Credit Report PDF</Label>
            <Input
              id="credit-report"
              type="file"
              onChange={handleFileChange}
              accept=".pdf"
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Upload className="mr-2" />
                Analyze Report
              </>
            )}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}

function AnalysisDisplay({ htmlContent }: { htmlContent: string }) {
  // In a real app, you would sanitize this HTML.
  // For this prototype, we trust the source (our own AI flow).
  return (
    <div
      className="prose dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

export default function CreditAnalysisPage() {
  const [analysisHtml, setAnalysisHtml] = useState<string | null>(null);

  return (
    <AppLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        {!analysisHtml ? (
          <CreditReportUploader onAnalysisComplete={setAnalysisHtml} />
        ) : (
          <AnalysisDisplay htmlContent={analysisHtml} />
        )}
      </div>
    </AppLayout>
  );
}
