
"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, CartesianGrid, XAxis, Line, Bar, BarChart } from "recharts";
import { useSession } from "@/context/session-provider";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Mock data until we have a real transactions collection
const chartData = [
  { month: "January", earnings: 186 },
  { month: "February", earnings: 305 },
  { month: "March", earnings: 237 },
  { month: "April", earnings: 73 },
  { month: "May", earnings: 209 },
  { month: "June", earnings: 214 },
];

const chartConfig = {
  earnings: {
    label: "Earnings ($)",
    color: "hsl(var(--primary))",
  },
};

export default function AffiliateReportsPage() {
  const { user, loading: userLoading } = useSession();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchTransactions() {
      setLoading(true);
      // This will be used when the 'transactions' collection is implemented
      // try {
      //   const q = query(
      //     collection(db, "transactions"),
      //     where("affiliateId", "==", user.uid),
      //     orderBy("timestamp", "asc")
      //   );
      //   const snap = await getDocs(q);
      //   setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      // } catch (err) {
      //   console.error("Error fetching transactions:", err);
      // } finally {
      //   setLoading(false);
      // }
      setLoading(false); // Remove this when real data is fetched
    }

    fetchTransactions();
  }, [user, userLoading]);

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <Button asChild variant="outline" size="sm" className="mb-4">
              <Link href="/affiliate">
                  <ArrowLeft className="mr-2"/>
                  Back to Dashboard
              </Link>
          </Button>
          <h1 className="text-3xl font-headline font-bold">Affiliate Reports</h1>
          <p className="text-muted-foreground">
            Visualize your performance and track your growth over time.
          </p>
        </div>

        {loading || userLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-primary" />
            </div>
        ) : (
            <Card>
                <CardHeader>
                    <CardTitle>Earnings Overview</CardTitle>
                    <CardDescription>Your commission earnings over the last 6 months.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <LineChart data={chartData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line
                                dataKey="earnings"
                                type="monotone"
                                stroke="var(--color-earnings)"
                                strokeWidth={2}
                                dot={true}
                            />
                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        )}
      </div>
    </AppLayout>
  );
}
