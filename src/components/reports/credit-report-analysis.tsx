
"use client";

import { useState } from "react";
import { runFlow } from "@genkit-ai/next/client";
import { analyzeCreditReport, AnalyzeCreditReportOutput } from "@/ai/flows/credit-report-analyzer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function AnalysisViewer({ html }: { html: string }) {
  return (
    <Card>
       <CardHeader>
        <CardTitle className="font-headline">Your In-Depth Credit Analysis</CardTitle>
        <CardDescription>
            This AI-powered analysis is based on the credit report you uploaded.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Rendered HTML is sanitized by the server-side prompt engineering */}
        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
      </CardContent>
    </Card>
  );
}


export function CreditReportAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeCreditReportOutput | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a credit report PDF to analyze.",
        variant: "destructive",
      });
      return;
    }
    setAnalysis(null);
    setAnalyzing(true);
    try {
      const creditReportDataUri = await toBase64(file);
      const result = await runFlow(analyzeCreditReport, { creditReportDataUri });
      setAnalysis(result);
      toast({
        title: "Analysis Complete",
        description: "Your credit report has been successfully analyzed.",
      });
    } catch (err) {
      toast({
        title: "Analysis Failed",
        description: (err as Error).message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Analyze a New Credit Report</CardTitle>
          <CardDescription>
            Upload your credit report (PDF) to get an instant AI-powered analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="credit-report-file">Credit Report PDF</Label>
              <div className="flex items-center gap-2">
                <Input id="credit-report-file" type="file" accept=".pdf" onChange={handleFileChange} />
              </div>
            </div>
            <Button type="submit" disabled={analyzing || !file}>
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Analyze Report
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {analyzing && (
        <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 text-muted-foreground min-h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-lg font-medium">Our AI is analyzing your report...</p>
                <p className="text-sm">This may take a minute. Please don't close this page.</p>
            </CardContent>
        </Card>
      )}

      {analysis && <AnalysisViewer html={analysis.analysisHtml} />}
      
    </div>
  );
}


    