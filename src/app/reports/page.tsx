import { AppLayout } from "@/components/app-layout";
import { CreditReportAnalysis } from "@/components/reports/credit-report-analysis";

export default function ReportsPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-headline font-bold">Credit Reports</h1>
          <p className="text-muted-foreground">
            Upload and manage your credit report analyses.
          </p>
        </div>
        <CreditReportAnalysis />
      </div>
    </AppLayout>
  );
}
