
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GenerateDisputeLetterInput,
  GenerateDisputeLetterOutput,
} from "@/ai/flows/dispute-letter-generator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type ChallengeItem = AnalyzeCreditReportOutput["challengeItems"][0];

export default function DisputesPage() {
  const { user, loading: userLoading } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isUpgraded, setIsUpgraded] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeCreditReportOutput | null>(null);
  const [loading, setLoading] = useState(true);

  // State for the letter generation modal
  const [isLetterDialogOpen, setIsLetterDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ChallengeItem | null>(null);
  const [letterData, setLetterData] = useState<GenerateDisputeLetterOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formValues, setFormValues] = useState({
    address: "",
    dob: "",
    creditBureau: "Equifax" as "Equifax" | "Experian" | "TransUnion",
  });

  useEffect(() => {
    if (userLoading) {
        return;
    }
    if (!user) {
        setLoading(false);
        // Let the AppLayout handle the redirect to /login
        return;
    }

    const fetchUserData = async () => {
        setLoading(true);
        const userDocRef = doc(db, "users", user.uid);
        const reportDocRef = doc(db, "reports", user.uid);

        try {
            const [userDocSnap, reportDocSnap] = await Promise.all([
                getDoc(userDocRef),
                getDoc(reportDocRef),
            ]);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                setIsUpgraded(userData?.upgraded === true);
                setFormValues(prev => ({ ...prev, address: userData?.address || '' }));
            }

            if (reportDocSnap.exists()) {
                // Here we can use safeParse to be extra sure, though data from Firestore should be trusted
                const result = AnalyzeCreditReportOutputSchema.safeParse(reportDocSnap.data());
                 if (result.success) {
                    setAnalysis(result.data);
                } else {
                    console.warn("Invalid report schema in Firestore:", result.error);
                    setAnalysis(null);
                }
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
            setAnalysis(null); // Clear analysis on error
        } finally {
            setLoading(false);
        }
    };
    fetchUserData();
  }, [user, userLoading, toast]);


  const handleOpenDialog = (item: ChallengeItem) => {
    setSelectedItem(item);
    setLetterData(null); // Reset previous letter
    // Prefill form values if we have them
    if (user) {
        getDoc(doc(db, "users", user.uid)).then(docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setFormValues(prev => ({
                    ...prev,
                    address: data.address || '',
                    // dob: data.dob || '', // Assuming dob is stored
                }));
            }
        });
    }
    setIsLetterDialogOpen(true);
  };

  const handleGenerateLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedItem || !formValues.address || !formValues.dob) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please fill out all required fields.",
        });
        return;
    }
    setIsGenerating(true);
    
    try {
      const input: GenerateDisputeLetterInput = {
        fullName: user.displayName || "",
        dob: formValues.dob,
        address: formValues.address,
        creditBureau: formValues.creditBureau,
        disputedItem: {
            // Assuming item name is in "Creditor - Acct ••1234" format
            creditor: selectedItem.name.split(' - ')[0] || 'Unknown Creditor',
            accountNumber: selectedItem.name.split(' - ')[1] || 'N/A',
        },
        disputeReasons: [selectedItem.reason],
      };
      
      const idToken = await user.getIdToken();
      const response = await fetch('/api/flows/generateDisputeLetter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`Server returned: ${response.status}: ${await response.text()}`);
      }
      
      const result: GenerateDisputeLetterOutput = await response.json();
      setLetterData(result);

    } catch (error) {
        console.error("Failed to generate letter", error);
        toast({
            variant: "destructive",
            title: "Generation Failed",
            description: "There was an error generating your letter. Please try again.",
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
                Upgrade your plan to generate and mail your personalized
                letters.
              </span>
              <Button onClick={() => router.push("/credits")}>
                Upgrade to Pro <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recommended Disputes</CardTitle>
            <CardDescription>
              Based on your analysis, we recommend challenging the following
              items.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!analysis || !analysis.challengeItems || analysis.challengeItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                <FileWarning className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  No Analysis Found
                </h3>
                <p className="text-muted-foreground mb-4">
                  You need to analyze a credit report before you can see
                  recommended disputes.
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
                  {analysis.challengeItems.map((dispute, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {dispute.name || "Unnamed Item"}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {dispute.reason || "No reason provided"}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-accent text-accent-foreground hover:bg-accent/80">
                            {dispute.successChance}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            disabled={!isUpgraded}
                            onClick={() => handleOpenDialog(dispute)}
                          >
                            {isUpgraded ? (
                              "Generate Letter"
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isLetterDialogOpen} onOpenChange={setIsLetterDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          {!letterData ? (
             <form onSubmit={handleGenerateLetter}>
                <DialogHeader>
                    <DialogTitle>Generate Dispute Letter</DialogTitle>
                    <DialogDescription>
                        Confirm your details and select the credit bureau to generate a personalized letter for: <br />
                        <span className="font-bold">{selectedItem?.name}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="address" className="text-right">Address</Label>
                        <Input id="address" value={formValues.address} onChange={(e) => setFormValues(prev => ({ ...prev, address: e.target.value }))} className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dob" className="text-right">Date of Birth</Label>
                        <Input id="dob" type="date" value={formValues.dob} onChange={(e) => setFormValues(prev => ({ ...prev, dob: e.target.value }))} className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="creditBureau" className="text-right">Credit Bureau</Label>
                         <Select
                            value={formValues.creditBureau}
                            onValueChange={(value) => setFormValues(prev => ({ ...prev, creditBureau: value as any }))}
                         >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a bureau" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Equifax">Equifax</SelectItem>
                                <SelectItem value="Experian">Experian</SelectItem>
                                <SelectItem value="TransUnion">TransUnion</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={isGenerating}>
                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isGenerating ? "Generating..." : "Generate Letter"}
                    </Button>
                </DialogFooter>
            </form>
          ) : (
            <>
                 <DialogHeader>
                    <DialogTitle>Your Dispute Letter is Ready</DialogTitle>
                    <DialogDescription>
                        Copy the text below and mail it to the specified credit bureau. Remember to include your proof of identity and address.
                    </DialogDescription>
                </DialogHeader>
                <div className="prose prose-sm dark:prose-invert max-h-[50vh] overflow-y-auto bg-muted p-4 rounded-md">
                   <Textarea readOnly className="w-full h-96 bg-background" value={letterData.letterContent} />
                </div>
                 <DialogFooter>
                     <Button variant="outline" onClick={() => { navigator.clipboard.writeText(letterData.letterContent); toast({title: "Copied to clipboard!"}) }}>Copy Text</Button>
                    <Button onClick={() => setIsLetterDialogOpen(false)}>Close</Button>
                </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
