
"use client";

import { useState } from "react";
import { runFlow } from "@genkit-ai/next/client";
import { analyzeCreditReport, AnalyzeCreditReportOutput } from "@/ai/flows/credit-report-analyzer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export function CreditReportUpload() {
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
    <div className="grid gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Analyze Your Credit Report</CardTitle>
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

      <Card className="min-h-[300px]">
        <CardHeader>
          <CardTitle className="font-headline">Analysis Results</CardTitle>
          <CardDescription>
            Errors, negative accounts, and improvement tips will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analyzing && (
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground h-full pt-10">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Our AI is analyzing your report...</p>
            </div>
          )}
          {analysis && (
            <div className="space-y-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle className="font-semibold">Analysis Summary</AlertTitle>
                <AlertDescription>{analysis.analysisSummary}</AlertDescription>
              </Alert>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Errors Identified</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {analysis.errorsIdentified.map((error, i) => <li key={i}>{error}</li>)}
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 text-destructive">Negative Accounts</h3>
                 <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
                  {analysis.negativeAccounts.map((account, i) => <li key={i}>{account}</li>)}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-accent">Improvement Opportunities</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-accent-foreground/90">
                  {analysis.improvementOpportunities.map((opp, i) => <li key={i}>{opp}</li>)}
                </ul>
              </div>

            </div>
          )}
          {!analyzing && !analysis && (
             <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground h-full pt-10">
              <p>Upload a report to see your analysis.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
