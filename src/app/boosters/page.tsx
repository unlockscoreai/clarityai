
"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp, Info, Banknote, ShieldCheck, Star, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/context/session-provider";
import { db } from "@/lib/firebase/client";
import { collection, query, getDocs, where, orderBy, limit } from "firebase/firestore";
import type { AnalyzeCreditProfileOutput } from "@/ai/flows/credit-report-analyzer";


type Booster = {
    id: string;
    name: string;
    description: string;
    url: string;
    type: string;
    price: string;
    limit: string;
    reportsTo: string[];
    potentialBoost: string;
    recommendedFor: string;
};

type KeyMetric = {
    label: string;
    value: string;
    recommendation: string;
};

// This function derives key metrics from the detailed analysis.
// In a real scenario, this logic might be more complex or part of the AI output itself.
const deriveKeyMetrics = (analysis: AnalyzeCreditProfileOutput | null): KeyMetric[] => {
    if (!analysis || !analysis.actionItems) return [];
    
    const metrics: KeyMetric[] = [];
    
    // Heuristic: Use action items to derive metrics. A more robust solution would be to have the AI return structured factors.
    const utilizationItem = analysis.actionItems.find(item => item.toLowerCase().includes('utilization'));
    if (utilizationItem) {
        const match = utilizationItem.match(/(\d+)%/);
        metrics.push({
            label: "Credit Utilization",
            value: match ? `${match[1]}%` : "High",
            recommendation: "Below 30% for optimal score boost"
        });
    }

    const inquiriesItem = analysis.actionItems.find(item => item.toLowerCase().includes('inquiries'));
    if (inquiriesItem) {
         const match = inquiriesItem.match(/(\d+)/);
        metrics.push({
            label: "Hard Inquiries",
            value: match ? match[1] : "High",
            recommendation: "Avoid new credit for 6-12 months"
        });
    }
    
    const mixItem = analysis.actionItems.find(item => item.toLowerCase().includes('credit mix'));
    if (mixItem) {
        const hasInstallment = !mixItem.toLowerCase().includes('add an installment');
        metrics.push({
            label: "Installment Loans",
            value: hasInstallment ? "Present" : "None",
            recommendation: hasInstallment ? "Maintain good payment history" : "Adding one can diversify credit mix"
        });
    }

    return metrics.slice(0, 4); // Return max 4 metrics
};


export default function CreditBoostersPage() {
    const { user, loading: userLoading } = useSession();
    const [boosters, setBoosters] = useState<Booster[]>([]);
    const [analysis, setAnalysis] = useState<AnalyzeCreditProfileOutput | null>(null);
    const [keyMetrics, setKeyMetrics] = useState<KeyMetric[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch boosters
                const boostersQuery = query(collection(db, "creditBoosters"), orderBy("name"));
                const boostersSnap = await getDocs(boostersQuery);
                setBoosters(boostersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booster)));

                // Fetch user's latest analysis if logged in
                if (user) {
                    const reportQuery = query(
                        collection(db, "reports"),
                        where("userId", "==", user.uid),
                        orderBy("createdAt", "desc"),
                        limit(1)
                    );
                    const reportSnap = await getDocs(reportQuery);
                    if (!reportSnap.empty) {
                        const analysisData = reportSnap.docs[0].data() as AnalyzeCreditProfileOutput;
                        setAnalysis(analysisData);
                        setKeyMetrics(deriveKeyMetrics(analysisData));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

  if (loading || userLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Summary & AI Insights */}
        {analysis && keyMetrics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Personalized Credit Insights
              </CardTitle>
              <CardDescription>
                This analysis is generated based on your current credit profile. Implementing these strategies can maximize your score potential.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{analysis.summary}</p>
              <div className="grid md:grid-cols-2 gap-4">
                {keyMetrics.map((metric, idx) => (
                  <div key={idx} className="p-3 border rounded-lg flex flex-col gap-1 hover:shadow-md transition">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{metric.label}</span>
                      <Badge variant="secondary">{metric.value}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{metric.recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <p className="text-sm text-muted-foreground italic">
                Credit Clarity AI can recommend the best boosters tailored to your profile for maximum score impact.
              </p>
            </CardFooter>
          </Card>
        )}

        {/* Boosters */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-500" />
              Recommended Credit Boosters
            </CardTitle>
            <CardDescription>
              These third-party services can add positive payment history, diversify your credit mix, and accelerate score growth.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {boosters.map((booster) => (
              <Card key={booster.name} className="flex flex-col border hover:shadow-lg transition">
                <CardHeader>
                  <CardTitle className="text-lg">{booster.name}</CardTitle>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant="secondary">{booster.type}</Badge>
                    <Badge variant="outline">{booster.price}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                  <p className="text-muted-foreground">{booster.description}</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-muted-foreground" />
                      <span><strong>Limit:</strong> {booster.limit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      <span><strong>Reports to:</strong> {booster.reportsTo.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-700" />
                      <span><strong>Potential Boost:</strong> {booster.potentialBoost}</span>
                    </div>
                    {analysis && (
                        <div className="text-xs text-muted-foreground italic pt-1">
                          Recommended for: {booster.recommendedFor}
                        </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="default" className="w-full">
                    <a href={booster.url} target="_blank" rel="noopener noreferrer">
                      Learn More
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </CardContent>

          <CardFooter className="flex-col items-start gap-2 rounded-lg border bg-secondary p-4 mt-6">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-muted-foreground"/>
              <h3 className="font-semibold">Important Disclaimer</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Credit Clarity AI is not affiliated with these services. The "potential boost" is an estimate based on your profile and industry data. Individual results vary. Review each service’s terms before signing up.
            </p>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}
