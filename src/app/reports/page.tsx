import { AppLayout } from "@/components/app-layout";
import { CreditAnalysisDisplay } from "@/components/reports/credit-analysis-display";
import { CreditReportUpload } from "@/components/reports/credit-report-upload";
import { Separator } from "@/components/ui/separator";

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
        <CreditReportUpload />
        <Separator />
        <CreditAnalysisDisplay />
      </div>
    </AppLayout>
  );
}
