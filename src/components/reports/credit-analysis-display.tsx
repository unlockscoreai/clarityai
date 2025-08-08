import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileHeart, CheckCircle } from 'lucide-react';

// This is mock data representing the output from the `analyzeCreditProfile` AI flow.
// In a real application, this would be fetched from your database after being generated during onboarding.
const analysis = {
  summary:
    'Your credit profile is on a solid track but has key areas for improvement, particularly in credit utilization and credit mix. Your payment history is excellent, which is a strong foundation to build upon.',
  actionItems: [
    'Your Credit Utilization Rate is at 42%. Pay down your Visa card balance by at least $1,500 to get under the recommended 30% threshold for a significant score boost.',
    'You currently have no active installment loans. Consider adding a credit-builder loan like Self or Kikoff to diversify your credit mix, which lenders like to see.',
    'You have 5 hard inquiries in the last year. Avoid applying for new credit for the next 6-12 months to allow these to have less impact on your score.',
    'Your oldest account is only 3 years old. Continue to manage your current accounts responsibly to build a longer credit history over time.',
  ],
};

export function CreditAnalysisDisplay() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <FileHeart className="h-6 w-6 text-primary" />
            Your Credit Analysis
          </CardTitle>
          <CardDescription>
            This AI-powered analysis is based on the credit report you
            uploaded. Follow these steps to improve your score.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTitle>Analysis Summary</AlertTitle>
            <AlertDescription>{analysis.summary}</AlertDescription>
          </Alert>
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Your Personalized Action Plan
            </h3>
            <div className="space-y-4">
              {analysis.actionItems.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-accent mt-1 shrink-0" />
                  <p className="text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
