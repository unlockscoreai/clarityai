
'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { AnalyzeCreditProfileOutput } from '@/ai/flows/credit-report-analyzer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, FileWarning, ListChecks, ShieldQuestion, BadgePercent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/context/session-provider';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { AppLayout } from '@/components/app-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ReportsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeCreditProfileOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useSession();

  const handleAnalyze = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select a credit report PDF to analyze.',
      });
      return;
    }
     if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'You must be logged in to analyze a report.',
      });
      return;
    }
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const idToken = await user.getIdToken();
      const response = await fetch('/api/flows/analyzeCreditProfileFlow', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${idToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned: ${response.status}: ${await response.text()}`);
      }

      const result: AnalyzeCreditProfileOutput = await response.json();
      setAnalysis(result);

      // Save the analysis to Firestore
      const reportsCollectionRef = collection(db, "reports");
      await addDoc(reportsCollectionRef, {
          ...result,
          userId: user.uid,
          fileName: file.name,
          createdAt: serverTimestamp(),
      });

      toast({
        title: 'Analysis Complete',
        description: 'Your new report has been analyzed and saved.',
      });

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
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 font-headline">Credit Analysis</h1>
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
          {loading ? <><Loader2 className="mr-2 animate-spin" /> Analyzing...</> : <><Sparkles className="mr-2" />Analyze Report</>}
        </Button>

        {error && !analysis && <p className="text-destructive mt-4">{error}</p>}

        {analysis && (
          <div className="mt-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">AI Summary</CardTitle>
                    <CardDescription>A brief overview of your credit profile analysis.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground prose prose-sm max-w-none">{analysis.summary}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center"><ListChecks className="mr-2 text-primary"/>Action Items</CardTitle>
                    <CardDescription>Personalized steps to improve your credit profile.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <ul className="list-disc space-y-2 pl-5">
                        {analysis.actionItems.map((item, idx) => (
                            <li key={idx} className="text-muted-foreground">{item}</li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center"><ShieldQuestion className="mr-2 text-primary"/>Disputable Items</CardTitle>
                    <CardDescription>Items identified as potentially disputable, with success probability.</CardDescription>
                </CardHeader>
                 <CardContent>
                    {analysis.disputableItems?.length ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead className="text-right">Success Chance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analysis.disputableItems.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium">{item.item}</TableCell>
                                        <TableCell>{item.reason}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="secondary" className="font-mono"><BadgePercent className="mr-1"/>{item.successProbability}%</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                            <FileWarning className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No Disputable Items Found</h3>
                            <p className="text-muted-foreground mb-4">
                            Our analysis did not find any items recommended for dispute.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>


            <div className="bg-primary/10 p-4 rounded-lg mt-6">
              <h3 className="text-lg font-bold text-primary mb-2">
                Ready to take action?
              </h3>
              <p className="text-primary/90">
                You can now generate dispute letters for the negative items found.
              </p>
              <Button asChild className="mt-3">
                   <Link href="/letters">
                      Go to Letter Center
                   </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
