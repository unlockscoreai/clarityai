
import { AppLayout } from "@/components/app-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileHeart, CheckCircle, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const analysis = {
  mergedScore: 649,
  generatedDate: "2025-08-08",
  snapshot: {
    derogatoryItems: 3,
    derogatoryItemsDetail: "1 collection, 1 charged-off account, 1 judgment",
    openAccounts: 7,
    totalAccounts: 12,
    hardInquiries12Months: 5,
    creditUtilization: 42,
    oldestAccountYears: 3.0,
  },
  summary:
    'Your credit profile is on a solid track thanks to strong recent payment activity, but several derogatory items and high utilization are weighing on your score. The most immediate lift we can target is credit utilization — lowering this under 30% could produce a noticeable improvement within 1–2 billing cycles. The collection and charged-off account both have missing creditor contact details in the report — those are high-probability disputes.',
  actionPlan: [
    { text: 'Pay down your Visa by $1,500 to get utilization <30%.', tags: ['High impact', 'medium effort'] },
    { text: 'Request validation for Collection (Acct: ABC) — evidence of missing original creditor details.', tags: ['High success chance', 'we recommend dispute + certified mail'] },
    { text: 'Dispute duplicate reporting (Acct: XYZ appears twice on different bureaus).', tags: ['Moderate success chance'] },
    { text: 'Avoid new credit applications for 6–12 months to let hard inquiry impact fade.', tags: [] },
    { text: 'Consider a credit-builder installment loan to diversify accounts.', tags: ['low cost', 'long-term benefit'] },
  ],
  itemsToChallenge: [
    { item: 'Collection — ABC Collections', type: 'Collection', why: 'No original creditor name; balance mismatch', successChance: '72%', nextStep: 'Send validation dispute + certified mail' },
    { item: 'Account — Visa 1234 (charged off)', type: 'Charged-off', why: 'Reporting gaps & last payment date inconsistent across bureaus', successChance: '48%', nextStep: 'Request verification & negotiate pay-for-delete' },
    { item: 'Hard Inquiry — BankXYZ (2024-02-14)', type: 'Inquiry', why: 'Older than 12 months, no consumer application on file', successChance: '80%', nextStep: 'Ask creditor for proof; send dispute if none provided' },
  ],
  impact: "30–45 days: Bureaus must investigate disputes; you’ll receive status updates.\n45–90 days: If successful, the most likely improvements (utilization reduction + removal of one collection) can increase your score by 15–35 points depending on baseline score and local scoring model.",
  upgradeFeatures: [
    "Automated, AI-generated dispute letters for each item",
    "Certified mail & tracking for each letter",
    "Priority processing (3–5 business day turnaround)",
    "Dedicated dispute dashboard & monthly progress report",
  ]
};

export default function CreditAnalysisPage() {
  return (
    <AppLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-headline font-bold">Your Credit Analysis</h1>
          <p className="text-muted-foreground">Generated: {analysis.generatedDate}</p>
          <p className="text-5xl font-headline font-bold mt-2 text-primary">{analysis.mergedScore}</p>
        </div>

        {/* Snapshot Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-card">
              <p className="text-3xl font-bold">{analysis.snapshot.derogatoryItems}</p>
              <p className="text-sm text-muted-foreground">Derogatory Items</p>
            </div>
             <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-card">
              <p className="text-3xl font-bold">{analysis.snapshot.openAccounts}</p>
              <p className="text-sm text-muted-foreground">Open Accounts</p>
            </div>
             <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-card">
              <p className="text-3xl font-bold">{analysis.snapshot.totalAccounts}</p>
              <p className="text-sm text-muted-foreground">Total Accounts</p>
            </div>
             <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-card">
              <p className="text-3xl font-bold">{analysis.snapshot.hardInquiries12Months}</p>
              <p className="text-sm text-muted-foreground">Hard Inquiries (12mo)</p>
            </div>
             <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-card">
              <p className="text-3xl font-bold">{analysis.snapshot.creditUtilization}%</p>
              <p className="text-sm text-muted-foreground">Credit Utilization</p>
            </div>
             <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-card">
              <p className="text-3xl font-bold">{analysis.snapshot.oldestAccountYears} <span className="text-lg">yrs</span></p>
              <p className="text-sm text-muted-foreground">Oldest Account</p>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Summary */}
        <Alert>
          <FileHeart className="h-4 w-4" />
          <AlertTitle>Analysis Summary</AlertTitle>
          <AlertDescription>{analysis.summary}</AlertDescription>
        </Alert>
        
        {/* Personalized Action Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Your Personalized Action Plan</CardTitle>
            <CardDescription>Follow these steps in order to maximize your score improvement potential.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {analysis.actionPlan.map((item, index) => (
                <li key={index} className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg shrink-0 mt-1">
                    {index + 1}
                  </div>
                  <div>
                    <p>{item.text}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
        
        {/* Items to Challenge */}
        <Card>
           <CardHeader>
            <CardTitle>Items We Recommend Challenging</CardTitle>
            <CardDescription>These items on your report have characteristics that suggest a good chance of being removed through a dispute.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Why</TableHead>
                  <TableHead>Success Chance</TableHead>
                  <TableHead>Next Step</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.itemsToChallenge.map((item) => (
                  <TableRow key={item.item}>
                    <TableCell className="font-medium">{item.item}<br/><Badge variant="outline">{item.type}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{item.why}</TableCell>
                    <TableCell><Badge className="text-lg bg-accent text-accent-foreground hover:bg-accent/80">{item.successChance}</Badge></TableCell>
                    <TableCell className="font-medium">{item.nextStep}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Impact & Timeline */}
        <Card>
            <CardHeader>
                <CardTitle>Likely Impact & Timeline</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{analysis.impact}</p>
            </CardContent>
        </Card>

        {/* Upgrade CTA */}
        <Card className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground border-none">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Want us to handle this for you? Upgrade to Pro!</CardTitle>
            <CardDescription className="text-primary-foreground/80">
                Start now — many clients see results within 1–3 months when they pair letters with utilization reduction.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <ul className="space-y-2">
                {analysis.upgradeFeatures.map(feature => (
                    <li key={feature} className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-accent" />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
             <Button asChild size="lg" className="font-bold bg-accent text-accent-foreground hover:bg-accent/90 w-full md:w-auto">
                <Link href="/credits">
                    Upgrade Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
             </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
