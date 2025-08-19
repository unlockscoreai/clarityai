
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, FileWarning, BadgeAlert, Sparkles, Download, ShieldQuestion, FileText, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/context/session-provider";
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { useGenerateDisputeLetter } from "@/hooks/useGenerateDisputeLetter";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";

type UserData = {
  plan: "starter" | "pro" | "vip";
  credits: number;
  fullName: string;
  address: string;
  dob: string;
};

type LetterPackage = {
  id: string;
  createdAt: any;
  letterPackage: {
    equifaxLetter?: string;
    experianLetter?: string;
    transunionLetter?: string;
    inquiryDisputeLetter?: string;
    section609Request?: string;
    creditRebuildingPlan?: string;
  }
};

export default function LettersPage() {
  const { user, loading: userLoading } = useSession();
  const router = useRouter();
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [latestReportUri, setLatestReportUri] = useState<string | null>(null);
  const [letterPackages, setLetterPackages] = useState<LetterPackage[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const { generateLetter, loading: generationLoading, error, letter: generatedPackage } = useGenerateDisputeLetter();

  const fetchPageData = useCallback(async () => {
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
            setLatestReportUri(reportSnap.docs[0].data().creditReportDataUri);
        }
        
        const lettersQuery = query(collection(db, "letters"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
        const lettersSnap = await getDocs(lettersQuery);
        setLetterPackages(lettersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LetterPackage)));

    } catch (fetchError) {
        console.error("Error fetching data:", fetchError);
    } finally {
        setPageLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!userLoading) {
      fetchPageData();
    }
  }, [user, userLoading, fetchPageData]);
  
  useEffect(() => {
    if (generatedPackage) {
      // A new package was generated, refetch the data to show it in the list
      fetchPageData();
    }
  }, [generatedPackage, fetchPageData]);

  const creditsAvailable = userData?.credits ?? 0;

  const handleGeneratePackage = async () => {
    if (!user || !userData || !latestReportUri) return;

    if (!userData.address || !userData.dob) {
        router.push('/settings?redirect=letters&reason=profile_incomplete');
        return;
    }
    
    if (creditsAvailable < 1) return; // Button should be disabled anyway
    
    const idToken = await user.getIdToken();
    await generateLetter({
      creditReportDataUri: latestReportUri,
      personalInformation: {
        fullName: user.displayName || userData.fullName,
        dob: userData.dob,
        address: userData.address,
      },
    }, idToken);
  };

  const downloadLetter = (content: string, name: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (pageLoading || userLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
      </AppLayout>
    );
  }
  
  const renderPackage = (pkg: LetterPackage) => {
    const documents = Object.entries(pkg.letterPackage).filter(([, content]) => content);
    
    return (
        <Card key={pkg.id}>
            <CardHeader>
                <CardTitle>Dispute Package - {new Date(pkg.createdAt.seconds * 1000).toLocaleDateString()}</CardTitle>
                <CardDescription>{documents.length} documents generated.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {documents.map(([title, content]) => (
                         <AccordionItem value={title} key={title}>
                             <AccordionTrigger>{title.replace(/([A-Z])/g, ' $1').trim()}</AccordionTrigger>
                             <AccordionContent>
                                 <div className="space-y-4">
                                     <Textarea readOnly value={content} className="h-64 font-mono text-xs" />
                                     <Button size="sm" variant="outline" onClick={() => downloadLetter(content!, title)}>
                                         <Download className="mr-2"/> Download
                                     </Button>
                                 </div>
                             </AccordionContent>
                         </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-headline font-bold">Letter Center</h1>
            <p className="text-muted-foreground">
                Generate a complete dispute package based on your latest credit report. This action costs 1 credit.
            </p>
        </div>

        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center"><ShieldQuestion className="mr-2"/>Dispute Package Generation</CardTitle>
                    <Badge variant="outline" className="text-lg py-1 px-4">
                        Credits: <span className="font-bold ml-2">{creditsAvailable}</span>
                    </Badge>
                </div>
                <CardDescription>
                  Use your latest analyzed report to generate letters for all 3 bureaus, an inquiry dispute letter, and more.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {!latestReportUri ? (
                  <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                    <FileWarning className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Credit Report Found</h3>
                    <p className="text-muted-foreground mb-4">
                      You need to analyze a credit report before you can generate a dispute package.
                    </p>
                    <Button asChild>
                      <Link href="/dashboard">Analyze Your First Report</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-start space-y-4">
                     <div className="flex items-center space-x-2 text-sm text-green-600">
                        <CheckCircle />
                        <span>Latest credit report is ready for dispute generation.</span>
                     </div>
                     <Button 
                        onClick={handleGeneratePackage}
                        disabled={generationLoading || creditsAvailable < 1}
                        size="lg"
                      >
                         {generationLoading ? <><Loader2 className="animate-spin mr-2" />Generating Package...</> : <><Sparkles className="mr-2" />Generate Full Dispute Package (1 Credit)</>}
                      </Button>
                  </div>
                )}
                 {creditsAvailable < 1 && latestReportUri && (
                    <Alert variant="destructive" className="mt-4">
                        <BadgeAlert className="h-4 w-4" />
                        <AlertTitle>Out of Credits</AlertTitle>
                        <AlertDescription>
                            You need at least 1 credit to generate a dispute package.
                             <Button asChild variant="link" className="p-0 h-auto ml-1 font-semibold"><Link href="/credits">Buy Credits</Link></Button>
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>

        <div className="space-y-4">
          {letterPackages.map(renderPackage)}
        </div>
      </div>
    </AppLayout>
  );
}

    