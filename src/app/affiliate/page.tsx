import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";

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

      </div>
    </AppLayout>
  );
}
