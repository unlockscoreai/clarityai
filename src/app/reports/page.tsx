
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CreditAnalysisPage() {

  return (
    <AppLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
         <Card>
            <CardHeader>
                <CardTitle>Your Credit Analysis</CardTitle>
                <CardDescription>Generated on: 2025-08-08</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <section id="snapshot-metrics">
                    <h2 className="text-xl font-semibold font-headline mb-4">Snapshot</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-secondary rounded-lg">
                            <p className="text-sm text-muted-foreground">Derogatory Items</p>
                            <p className="text-2xl font-bold">3</p>
                        </div>
                        <div className="p-4 bg-secondary rounded-lg">
                            <p className="text-sm text-muted-foreground">Open Accounts</p>
                            <p className="text-2xl font-bold">7</p>
                        </div>
                        <div className="p-4 bg-secondary rounded-lg">
                            <p className="text-sm text-muted-foreground">Total Accounts</p>
                            <p className="text-2xl font-bold">12</p>
                        </div>
                        <div className="p-4 bg-secondary rounded-lg">
                            <p className="text-sm text-muted-foreground">Hard Inquiries (12mo)</p>
                            <p className="text-2xl font-bold">5</p>
                        </div>
                        <div className="p-4 bg-secondary rounded-lg">
                            <p className="text-sm text-muted-foreground">Credit Utilization</p>
                            <p className="text-2xl font-bold">42%</p>
                        </div>
                        <div className="p-4 bg-secondary rounded-lg">
                            <p className="text-sm text-muted-foreground">Oldest Account</p>
                            <p className="text-2xl font-bold">3.0 yrs</p>
                        </div>
                    </div>
                </section>

                <section id="analysis-summary">
                    <h2 className="text-xl font-semibold font-headline my-4">Analysis Summary</h2>
                    <p className="text-muted-foreground">Your credit profile is on a solid track thanks to strong recent payment activity, but several derogatory items and high utilization are weighing on your score. The most immediate lift we can target is credit utilization — lowering this under 30% could produce a noticeable improvement within 1–2 billing cycles. The collection and charged-off account both have missing creditor contact details in the report — those are high-probability disputes.</p>
                </section>

                <section id="action-plan">
                    <h2 className="text-xl font-semibold font-headline my-4">Your Personalized Action Plan</h2>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                        <li>Pay down your Visa by $1,500 to get utilization &lt;30%. (High impact / medium effort)</li>
                        <li>Request validation for Collection (Acct: ABC) — evidence of missing original creditor details → High success chance (we recommend dispute + certified mail).</li>
                        <li>Dispute duplicate reporting (Acct: XYZ appears twice on different bureaus). (Moderate success chance)</li>
                        <li>Avoid new credit applications for 6–12 months to let hard inquiry impact fade.</li>
                        <li>Consider a credit-builder installment loan to diversify accounts (low cost, long-term benefit).</li>
                    </ol>
                </section>
                
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
      </div>
    </AppLayout>
  );
}
