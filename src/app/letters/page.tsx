
"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, ArrowRight, Loader2, FileWarning, Info, BadgeAlert, Sparkles, Download } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/context/session-provider";
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import type { AnalyzeCreditReportOutput } from "@/ai/flows/credit-report-analyzer";
import { GenerateDisputeLetterInput } from "@/ai/flows/dispute-letter-generator";
import { useToast } from "@/hooks/use-toast";
import { useGenerateDisputeLetter } from "@/hooks/useGenerateDisputeLetter";
import { Badge } from "@/components/ui/badge";

type ChallengeItem = AnalyzeCreditReportOutput["negativeItems"][0];
type UserData = {
  plan: "starter" | "pro" | "vip";
  credits: number;
  fullName: string;
  address: string;
  dob: string;
};
type LetterRecord = {
    id: string;
    letterContent: string;
    createdAt: any;
    disputedItem: {
        name: string;
    };
};

export default function LettersPage() {
  const { user, loading: userLoading } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeCreditReportOutput | null>(null);
  const [letters, setLetters] = useState<LetterRecord[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [activeGenerationItem, setActiveGenerationItem] = useState<string | null>(null);

  const { generateLetter, loading: generationLoading } = useGenerateDisputeLetter();

  const fetchUserDataAndReport = useCallback(async () => {
    if (!user) return;
    setPageLoading(true);
    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            setUserData(userDocSnap.data() as UserData);
        }

        const reportQuery = query(
          collection(db, "reports"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const reportSnap = await getDocs(reportQuery);

        if (!reportSnap.empty) {
            setAnalysis(reportSnap.docs[0].data() as AnalyzeCreditReportOutput);
        }
        
        const lettersQuery = query(collection(db, "letters"), where("userId", "==", user.uid));
        const lettersSnap = await getDocs(lettersQuery);
        setLetters(lettersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LetterRecord)));

    } catch (error) {
        console.error("Error fetching data:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load your dispute data.",
        });
    } finally {
        setPageLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setPageLoading(false);
      return;
    }
    fetchUserDataAndReport();
  }, [user, userLoading, fetchUserDataAndReport]);
  
  const creditsAvailable = userData?.credits ?? 0;

  const handleGenerateLetter = async (item: ChallengeItem) => {
    if (!user || !userData) return;

    if (!userData.address || !userData.dob) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please complete your profile in settings before generating letters.",
        });
        router.push('/settings');
        return;
    }
    
    if (creditsAvailable < 1) {
        toast({ variant: "destructive", title: "No Credits", description: "You need at least 1 credit to generate a letter."});
        return;
    }
    
    setActiveGenerationItem(item.account);

    const input: GenerateDisputeLetterInput = {
        fullName: user.displayName || userData.fullName,
        dob: userData.dob,
        address: userData.address,
        creditBureau: 'Equifax',
        disputedItem: {
            name: item.account,
            reason: `This item is being disputed as per my records. (Item type: ${item.type}, Date: ${item.date})`,
        },
    };
    
    const idToken = await user.getIdToken();
    const result = await generateLetter(input, idToken);
    
    if (result) {
      // On success, refetch all data to update the UI
      await fetchUserDataAndReport();
    }
    
    setActiveGenerationItem(null);
  };

  const downloadLetter = (content: string, name: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/ /g, '_')}_dispute_letter.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (pageLoading || userLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-4 text-muted-foreground">
            Loading your Letter Center...
          </p>
        </div>
      </AppLayout>
    );
  }

  const challengeItems = analysis?.negativeItems ?? [];
  const isGenerated = (itemName: string) => letters.some(l => l.disputedItem.name === itemName);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-headline font-bold">Letter Center</h1>
            <p className="text-muted-foreground">
                Generate and manage your dispute letters. Each letter costs 1 credit.
            </p>
        </div>

        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Dispute Generation</CardTitle>
                    <Badge variant="outline" className="text-lg py-1 px-4">
                        Credits: <span className="font-bold ml-2">{creditsAvailable}</span>
                    </Badge>
                </div>
                <CardDescription>
                  Select items from your analysis to generate dispute letters.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {challengeItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                    <FileWarning className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Negative Items Found</h3>
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
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {challengeItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.account}</TableCell>
                          <TableCell className="text-muted-foreground max-w-xs truncate">{item.type}</TableCell>
                          <TableCell className="text-right">
                            {isGenerated(item.account) ? (
                                <Badge variant="secondary">Generated</Badge>
                            ) : (
                                <Button 
                                    size="sm"
                                    onClick={() => handleGenerateLetter(item)}
                                    disabled={generationLoading || creditsAvailable < 1}
                                >
                                    {generationLoading && activeGenerationItem === item.account ? <Loader2 className="animate-spin" /> : <Sparkles className="mr-2" />}
                                    Generate
                                </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                 {creditsAvailable < 1 && challengeItems.length > 0 && (
                    <Alert variant="destructive" className="mt-4">
                        <BadgeAlert className="h-4 w-4" />
                        <AlertTitle>Out of Credits</AlertTitle>
                        <AlertDescription>
                            You have no credits left. To generate more letters, please purchase a credit pack.
                             <Button asChild variant="link" className="p-0 h-auto ml-1 font-semibold"><Link href="/credits">Buy Credits</Link></Button>
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>

        {letters.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>Generated Letters</CardTitle>
                    <CardDescription>
                        Download your previously generated letters.
                    </CardDescription>
                </Header>
                <CardContent>
                     <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Disputed Item</TableHead>
                            <TableHead>Date Generated</TableHead>
                            <TableHead className="text-right">Download</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {letters.map((letter) => (
                            <TableRow key={letter.id}>
                              <TableCell className="font-medium">{letter.disputedItem.name}</TableCell>
                              <TableCell>{new Date(letter.createdAt.seconds * 1000).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="outline" onClick={() => downloadLetter(letter.letterContent, letter.disputedItem.name)}>
                                    <Download className="mr-2" />
                                    Download
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                </CardContent>
            </Card>
        )}
      </div>
    </AppLayout>
  );
}
