
"use client";

import { CreditReportAnalysis } from "@/components/reports/credit-report-analysis";
import { AppLayout } from "@/components/app-layout";

export default function ReportsPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <CreditReportAnalysis />
      </div>
    </AppLayout>
  );
}

    