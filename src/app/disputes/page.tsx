
"use client";

import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

const recommendedDisputes = [
    { item: 'Collection — ABC Collections', type: 'Collection', why: 'No original creditor name; balance mismatch', successChance: '72%' },
    { item: 'Account — Visa 1234 (charged off)', type: 'Charged-off', why: 'Reporting gaps & last payment date inconsistent', successChance: '48%' },
    { item: 'Hard Inquiry — BankXYZ (2024-02-14)', type: 'Inquiry', why: 'Older than 12 months, no consumer application on file', successChance: '80%' },
];

export default function DisputesPage() {
  const [isUpgraded, setIsUpgraded] = useState(false); // Mock user status

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-headline font-bold">
              Dispute Center
            </h1>
            <p className="text-muted-foreground">
              Review and generate your AI-powered dispute letters based on your
              report analysis.
            </p>
          </div>
        </div>

        {!isUpgraded && (
          <Alert className="border-primary">
            <Lock className="h-4 w-4" />
            <AlertTitle>Your potential disputes are ready!</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
                <span>
                    Upgrade your plan to generate and mail your personalized letters.
                </span>
                 <Button onClick={() => setIsUpgraded(true)}>
                    Upgrade to Pro <ArrowRight className="ml-2 h-4 w-4" />
                 </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recommended Disputes</CardTitle>
            <CardDescription>
              Based on your analysis, we recommend challenging the following items.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Item to Dispute</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Success Chance</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recommendedDisputes.map(dispute => (
                        <TableRow key={dispute.item}>
                            <TableCell className="font-medium">
                                {dispute.item}
                                <br/>
                                <Badge variant="outline">{dispute.type}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-xs truncate">{dispute.why}</TableCell>
                            <TableCell>
                                <Badge className="bg-accent text-accent-foreground hover:bg-accent/80">{dispute.successChance}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button disabled={!isUpgraded}>
                                    {isUpgraded ? "Generate Letter" : <Lock className="h-4 w-4" />}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
