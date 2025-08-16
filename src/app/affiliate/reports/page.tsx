
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
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, Bar, BarChart, PieChart, Pie, Cell } from "recharts";
import { useSession } from "@/context/session-provider";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


// Mock Data for demonstration purposes
const MOCK_MONTHLY_DATA = [
  { month: "Jan", earnings: 450, referrals: 4 },
  { month: "Feb", earnings: 520, referrals: 5 },
  { month: "Mar", earnings: 680, referrals: 7 },
  { month: "Apr", earnings: 590, referrals: 6 },
  { month: "May", earnings: 810, referrals: 8 },
  { month: "Jun", earnings: 950, referrals: 10 },
];

const MOCK_PLAN_DATA = [
    { name: "Starter", value: 12 },
    { name: "Pro", value: 8 },
    { name: "VIP", value: 5 },
];

const MOCK_LEADERBOARD = [
    { name: "John Doe", earnings: 5250 },
    { name: "Jane Smith", earnings: 4800 },
    { name: "Michael B.", earnings: 4750 },
    { name: "Your Affiliate", earnings: 950 },
    { name: "Emily White", earnings: 850 },
].sort((a,b) => b.earnings - a.earnings);


const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--chart-3))"];

const chartConfig = {
  earnings: {
    label: "Earnings ($)",
    color: "hsl(var(--primary))",
  },
  referrals: {
    label: "Referrals",
    color: "hsl(var(--accent))",
  }
};

export default function AffiliateReportsPage() {
  const { user, loading: userLoading } = useSession();
  const [loading, setLoading] = useState(false); // Used for async data fetching in future
  
  // In a real app, these would be fetched from Firestore
  const [monthlyData, setMonthlyData] = useState(MOCK_MONTHLY_DATA);
  const [planData, setPlanData] = useState(MOCK_PLAN_DATA);
  const [leaderboard, setLeaderboard] = useState(MOCK_LEADERBOARD);


  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
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
            <div className="grid gap-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Monthly Referrals</CardTitle>
                            <CardDescription>New clients and affiliates you've onboarded.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig} className="h-[200px] w-full">
                                <LineChart data={monthlyData} margin={{ left: -20, right: 10 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                                    <YAxis />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Line type="monotone" dataKey="referrals" stroke="var(--color-referrals)" strokeWidth={3} dot={true} />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Monthly Earnings</CardTitle>
                            <CardDescription>Your commission earnings over the last 6 months.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig} className="h-[200px] w-full">
                                <LineChart data={monthlyData} margin={{ left: -20, right: 10 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8}/>
                                     <YAxis />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Line type="monotone" dataKey="earnings" stroke="var(--color-earnings)" strokeWidth={3} dot={true} />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Plan Distribution</CardTitle>
                            <CardDescription>A breakdown of the plans your clients are on.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig} className="h-[200px] w-full">
                                <PieChart>
                                    <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                    <Pie data={planData} dataKey="value" nameKey="name" innerRadius={50}>
                                        {planData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle>Leaderboard</CardTitle>
                        <CardDescription>See how you stack up against other top affiliates.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rank</TableHead>
                                    <TableHead>Affiliate</TableHead>
                                    <TableHead className="text-right">Earnings</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaderboard.map((a, i) => (
                                    <TableRow key={i} className={a.name === "Your Affiliate" ? "bg-accent/50" : ""}>
                                        <TableCell className="font-bold">{i+1}</TableCell>
                                        <TableCell>{a.name}</TableCell>
                                        <TableCell className="text-right font-medium">${a.earnings.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        )}
      </div>
    </AppLayout>
  );
}
