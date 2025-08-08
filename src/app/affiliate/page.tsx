import { AppLayout } from "@/components/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, PlusCircle } from "lucide-react";
import Link from "next/link";

const referrals = [
    {
        name: "John Doe",
        type: "Client",
        status: "Active",
        joinDate: "2024-07-01",
        earnings: "$50.00",
    },
    {
        name: "Jane Smith",
        type: "Affiliate",
        status: "Active",
        joinDate: "2024-06-15",
        earnings: "$125.50",
    },
    {
        name: "Michael Brown",
        type: "Client",
        status: "Pending",
        joinDate: "2024-07-20",
        earnings: "$0.00",
    },
    {
        name: "Emily White",
        type: "Client",
        status: "Active",
        joinDate: "2024-05-10",
        earnings: "$75.00",
    },
    {
        name: "David Green",
        type: "Affiliate",
        status: "Inactive",
        joinDate: "2024-03-22",
        earnings: "$25.00",
    },
];


export default function AffiliatePage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-headline font-bold">Affiliate Dashboard</h1>
          <p className="text-muted-foreground">
            Track your referrals, earnings, and team performance.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Your Referral Link</CardTitle>
                    <CardDescription>Share this link to refer new clients and earn commissions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex w-full max-w-lg items-center space-x-2">
                        <Input type="text" readOnly value="https://creditclarity.ai/ref/YOUR_ID" />
                        <Button type="submit">
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
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle>Total Referrals</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">42</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Total Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">$1,250.75</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Team Credit Volume</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">250</p>
                    <p className="text-sm text-muted-foreground">Next bonus at 500 credits</p>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Client Management</CardTitle>
                <CardDescription>A list of your personally referred clients and affiliates.</CardDescription>
            </CardHeader>
            <CardContent>
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
                        {referrals.map((referral) => (
                            <TableRow key={referral.name}>
                                <TableCell className="font-medium">{referral.name}</TableCell>
                                <TableCell>{referral.type}</TableCell>
                                <TableCell>
                                    <Badge variant={referral.status === 'Active' ? 'secondary' : 'outline'}>
                                        {referral.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{referral.joinDate}</TableCell>
                                <TableCell className="text-right">{referral.earnings}</TableCell>
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
