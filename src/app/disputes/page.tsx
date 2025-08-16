
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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, ArrowRight, Loader2, FileWarning, Info } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/context/session-provider";
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import type { AnalyzeCreditReportOutput } from "@/ai/flows/credit-report-analyzer";
import { GenerateDisputeLetterInput } from "@/ai/flows/dispute-letter-generator";
import { useToast } from "@/hooks/use-toast";

type ChallengeItem = AnalyzeCreditReportOutput["challengeItems"][0];
type UserData = {
  plan: "starter" | "pro" | "vip";
  credits: number;
  fullName: string;
  address: string;
  dob: string;
};

export default function DisputesPage() {
  const { user, loading: userLoading } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeCreditReportOutput | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedItems, setSelectedItems] = useState<ChallengeItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchUserDataAndReport = async () => {
        setLoading(true);
        try {
            // Fetch user plan and details first
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                setUserData(userDocSnap.data() as UserData);
            }
            
            // Fetch the latest report
            const reportQuery = query(
              collection(db, "reports"),
              where("userId", "==", user.uid),
              orderBy("createdAt", "desc"),
              limit(1)
            );
            const reportSnap = await getDocs(reportQuery);

            if (!reportSnap.empty) {
                const reportData = reportSnap.docs[0].data() as AnalyzeCreditReportOutput;
                setAnalysis(reportData);
            } else {
                setAnalysis(null);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not load your dispute data.",
            });
        } finally {
            setLoading(false);
        }
    };
    fetchUserDataAndReport();
  }, [user, userLoading, toast]);
  
  const creditsAvailable = userData?.credits ?? 0;
  const creditsUsed = selectedItems.length;

  const handleSelect = (item: ChallengeItem, checked: boolean) => {
    setSelectedItems(prev => {
        if (checked) {
            if (creditsUsed < creditsAvailable) {
                return [...prev, item];
            } else {
                toast({
                    variant: "destructive",
                    title: "Not Enough Credits",
                    description: `You only have ${creditsAvailable} credit(s) available.`,
                });
                return prev;
            }
        } else {
            return prev.filter(i => i.name !== item.name);
        }
    });
  };

  const handleGenerateLetters = async () => {
    if (!user || !userData || selectedItems.length === 0) return;

    if (!userData.address || !userData.dob) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please complete your profile in settings before generating letters.",
        });
        router.push('/settings');
        return;
    }

    setIsGenerating(true);
    
    try {
        const idToken = await user.getIdToken();
        
        const promises = selectedItems.map(item => {
            const input: GenerateDisputeLetterInput = {
                fullName: user.displayName || userData.fullName,
                dob: userData.dob,
                address: userData.address,
                // For now, we will generate a letter for each bureau. A real app might let the user choose.
                creditBureau: 'Equifax', // This could be made dynamic
                disputedItem: {
                    name: item.name,
                    reason: item.reason,
                },
            };
            return fetch('/api/flows/generateDisputeLetter', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify(input),
            });
        });
        
        const results = await Promise.all(promises);
        const errors = results.filter(r => !r.ok);

        if (errors.length > 0) {
            const errorText = await errors[0].text();
            throw new Error(`Failed to generate ${errors.length} letters. First error: ${errorText}`);
        }
        
        toast({
            title: "Letters Generated Successfully!",
            description: `${results.length} dispute letter(s) have been created and your credits updated.`,
        });

        // Reset selection and force a refetch of user data
        setSelectedItems([]);
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            setUserData(userDocSnap.data() as UserData);
        }

    } catch (error: any) {
        console.error("Failed to generate letters", error);
        toast({
            variant: "destructive",
            title: "Generation Failed",
            description: error.message || "There was an error generating your letters. Please try again.",
        });
    } finally {
        setIsGenerating(false);
    }
  };

  if (loading || userLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-4 text-muted-foreground">
            Loading your dispute center...
          </p>
        </div>
      </AppLayout>
    );
  }

  const isUpgraded = userData?.plan === 'pro' || userData?.plan === 'vip';

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-headline font-bold">Dispute Center</h1>
            <p className="text-muted-foreground">
                Select items from your analysis to generate dispute letters.
            </p>
        </div>

        {!isUpgraded && (
          <Alert className="border-primary">
            <Info className="h-4 w-4" />
            <AlertTitle>Upgrade to Generate Letters</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>
                Your potential disputes are ready! Upgrade to a Pro plan to generate and mail your letters.
              </span>
              <Button onClick={() => router.push("/credits")}>
                Upgrade Plan <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Recommended Disputes</CardTitle>
            <CardDescription>
              Based on your analysis, we recommend challenging these items. Each letter costs 1 credit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!analysis || !analysis.challengeItems || analysis.challengeItems.length === 0 ? (
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
                    <TableHead className="w-[50px]">Select</TableHead>
                    <TableHead>Item to Dispute</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Success Chance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.challengeItems.map((dispute, index) => {
                      const isSelected = selectedItems.some(i => i.name === dispute.name);
                      const canSelectMore = creditsUsed < creditsAvailable;
                      const isDisabled = !isUpgraded || (!isSelected && !canSelectMore);
                      return (
                      <TableRow key={index} data-state={isSelected ? 'selected' : ''}>
                        <TableCell>
                           <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => handleSelect(dispute, !!checked)}
                                disabled={isDisabled}
                                aria-label="Select dispute"
                           />
                        </TableCell>
                        <TableCell className="font-medium">
                          {dispute.name || "Unnamed Item"}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {dispute.reason || "No reason provided"}
                        </TableCell>
                        <TableCell>
                           <span className="font-semibold">{dispute.successChance}%</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {analysis && analysis.challengeItems.length > 0 && isUpgraded && (
            <Card>
                <CardHeader>
                    <CardTitle>Generate Your Letters</CardTitle>
                    <CardDescription>
                        You have selected {creditsUsed} item(s) to dispute. This will use {creditsUsed} of your {creditsAvailable} available credits.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <p className="font-bold">Total Credits After Generation: {creditsAvailable - creditsUsed}</p>
                            <p className="text-sm text-muted-foreground">Ready to improve your score?</p>
                        </div>
                        <Button 
                            onClick={handleGenerateLetters}
                            disabled={isGenerating || creditsUsed === 0}
                            size="lg"
                            className="font-bold"
                        >
                            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isGenerating ? 'Generating...' : `Generate ${creditsUsed} Letter(s)`}
                            <FileText className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )}

      </div>
    </AppLayout>
  );
}
