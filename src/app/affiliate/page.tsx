
"use client";

import { AppLayout } from "@/components/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, PlusCircle, Loader2, LineChart } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/context/session-provider";
import { collection, query, getDocs, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useEffect, useState } from "react";

type Client = {
    id: string;
    name: string;
    status: string;
    createdAt: any;
    earnings?: number;
    type: "Client";
};

type Affiliate = {
    id: string;
    name: string;
    status: "Active" | "Inactive";
    joinDate: any;
    earnings?: number;
    type: "Affiliate";
};

type Referral = Client | Affiliate;

export default function AffiliatePage() {
    const { user, loading: userLoading } = useSession();
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoading(true);
            const affiliateId = user.uid;
            
            try {
                // Fetch clients
                const clientsQuery = query(collection(db, "affiliates", affiliateId, "clients"));
                const clientsSnap = await getDocs(clientsQuery);
                const clientsData: Client[] = clientsSnap.docs.map(doc => ({
                    id: doc.id,
                    type: "Client",
                    earnings: 0, // Placeholder
                    ...doc.data(),
                } as Client));
                
                // Fetch referred affiliates (assuming a subcollection)
                const affiliatesQuery = query(collection(db, "affiliates", affiliateId, "referredAffiliates"));
                const affiliatesSnap = await getDocs(affiliatesQuery);
                const affiliatesData: Affiliate[] = affiliatesSnap.docs.map(doc => ({
                    id: doc.id,
                    type: "Affiliate",
                    earnings: 0, // Placeholder
                    ...doc.data(),
                } as Affiliate));
                
                setReferrals([...clientsData, ...affiliatesData]);

            } catch (error) {
                console.error("Failed to fetch affiliate data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        
    }, [user]);
    
    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
    };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-headline font-bold">Affiliate Dashboard</h1>
          <p className="text-muted-foreground">
            Track your referrals, earnings, and team performance.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle>Your Referral Link</CardTitle>
                    <CardDescription>Share this link to refer new clients and earn commissions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex w-full max-w-lg items-center space-x-2">
                        <Input type="text" readOnly value={`https://creditclarity.ai/ref/${user?.uid}`} />
                        <Button type="button" onClick={() => navigator.clipboard.writeText(`https://creditclarity.ai/ref/${user?.uid}`)}>
                            <Copy className="mr-2 h-4 w-4"/>
                            Copy Link
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Onboard a New Client</CardTitle>
                    <CardDescription>Manually add a client to your dashboard and start their file.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/affiliate/add-client">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Client
                        </Link>
                    </Button>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>View Reports</CardTitle>
                    <CardDescription>See detailed reports of your earnings and referrals over time.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="outline">
                        <Link href="/affiliate/reports">
                            <LineChart className="mr-2 h-4 w-4" />
                            View Reports
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle>Total Referrals</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">{referrals.length}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Total Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">$0.00</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Team Credit Volume</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Next bonus at 500 credits</p>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Client & Affiliate Management</CardTitle>
                <CardDescription>A list of your personally referred clients and affiliates.</CardDescription>
            </CardHeader>
            <CardContent>
                 {loading || userLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="animate-spin text-primary" />
                    </div>
                ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Join Date</TableHead>
                            <TableHead className="text-right">Earnings</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {referrals.length > 0 ? referrals.map((referral) => (
                            <TableRow key={referral.id}>
                                <TableCell className="font-medium">{referral.name}</TableCell>
                                <TableCell>{referral.type}</TableCell>
                                <TableCell>
                                    <Badge variant={referral.status === 'Active' || referral.status === 'pending_analysis' ? 'secondary' : 'outline'}>
                                        {referral.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{formatDate(referral.createdAt || (referral as Affiliate).joinDate)}</TableCell>
                                <TableCell className="text-right">${(referral.earnings ?? 0).toFixed(2)}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">No referrals yet.</TableCell>
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

    