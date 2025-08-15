
"use client";

import { useState, useEffect } from "react";
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
import { Lock, ArrowRight, Loader2, FileWarning } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/context/session-provider";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import type { AnalyzeCreditReportOutput } from "@/ai/flows/credit-report-analyzer";


export default function DisputesPage() {
  const { user, loading: userLoading } = useSession();
  const router = useRouter();
  const [isUpgraded, setIsUpgraded] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeCreditReportOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        setLoading(true);
        const userDocRef = doc(db, "users", user.uid);
        const reportDocRef = doc(db, "reports", user.uid);

        try {
          const [userDoc, reportDoc] = await Promise.all([
            getDoc(userDocRef),
            getDoc(reportDocRef)
          ]);

          if (userDoc.exists()) {
            setIsUpgraded(userDoc.data()?.upgraded === true);
          }

          if (reportDoc.exists()) {
            setAnalysis(reportDoc.data() as AnalyzeCreditReportOutput);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchUserData();
    } else if (!userLoading) {
        setLoading(false);
    }
  }, [user, userLoading]);
  

  if (loading || userLoading) {
    return (
        <AppLayout>
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-4 text-muted-foreground">Loading your dispute center...</p>
            </div>
        </AppLayout>
    )
  }

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
                 <Button onClick={() => router.push('/credits')}>
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
            {!analysis ? (
                 <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                    <FileWarning className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Analysis Found</h3>
                    <p className="text-muted-foreground mb-4">
                        You need to analyze a credit report before you can see recommended disputes.
                    </p>
                    <Button asChild>
                        <Link href="/reports">Analyze Your First Report</Link>
                    </Button>
                </div>
            ) : (
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
                        {analysis.challengeItems && analysis.challengeItems.length > 0 ? (
                             analysis.challengeItems.map((dispute, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">
                                        {dispute.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground max-w-xs truncate">{dispute.reason}</TableCell>
                                    <TableCell>
                                        <Badge className="bg-accent text-accent-foreground hover:bg-accent/80">{dispute.successChance}%</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button disabled={!isUpgraded}>
                                            {isUpgraded ? "Generate Letter" : <Lock className="h-4 w-4" />}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Congratulations! No disputable items were found in your report.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
