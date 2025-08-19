
'use client';

import type { AnalyzeCreditProfileOutput } from '@/ai/flows/credit-report-analyzer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileHeart, CheckCircle, ShieldQuestion, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function CreditReportAnalysis({ analysis }: { analysis: AnalyzeCreditProfileOutput }) {
  return (
    <div className="space-y-6">
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
          <Alert>
            <AlertTitle>Analysis Summary</AlertTitle>
            <AlertDescription>{analysis.summary}</AlertDescription>
          </Alert>

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

      {analysis.disputableItems && analysis.disputableItems.length > 0 && (
        <Card>
          <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <ShieldQuestion className="h-6 w-6 text-primary" />
                Disputable Items Identified
              </CardTitle>
              <CardDescription>
                Our AI has identified the following items on your report that may be inaccurate or incomplete.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.disputableItems.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <p className="font-semibold">{item.item}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.reason}</p>
                <p className="text-sm font-bold text-primary mt-2">
                  {item.successProbability}% estimated success probability
                </p>
              </div>
            ))}
             <Button asChild className="mt-4">
              <Link href="/letters">
                  Go to Letter Center <ArrowUpRight className="ml-2"/>
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
