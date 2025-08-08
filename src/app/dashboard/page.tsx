import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';

import {
  ArrowUpRight,
  BadgeCent,
  FileText,
  Upload,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Credit Score</CardDescription>
                <CardTitle className="text-4xl font-headline">720</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  +20 from last month
                </div>
              </CardContent>
              <CardFooter>
                <Progress value={72} aria-label="72% credit score" />
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Credits Remaining</CardDescription>
                <CardTitle className="text-4xl font-headline">3</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Renews in 15 days
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild size="sm" className="w-full">
                  <Link href="/credits">
                    <BadgeCent className="mr-2 h-4 w-4" /> Buy Credits
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Negative Items</CardDescription>
                <CardTitle className="text-4xl font-headline">4</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  2 disputes in progress
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/reports">
                    <FileText className="mr-2 h-4 w-4" /> View Report
                  </Link>
                </Button>
              </CardFooter>
            </Card>
             <Card>
              <CardHeader className="pb-2">
                <CardDescription>Affiliate Earnings</CardDescription>
                <CardTitle className="text-4xl font-headline">$125</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  +12% this month
                </div>
              </CardContent>
              <CardFooter>
                 <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/affiliate">
                    <ArrowUpRight className="mr-2 h-4 w-4" /> View Affiliate Stats
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Dispute Letters</CardTitle>
              <CardDescription>
                Track the status of your generated dispute letters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bureau</TableHead>
                    <TableHead>Date Generated</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Experian</TableCell>
                    <TableCell>2024-07-15</TableCell>
                    <TableCell className="text-right"><Badge variant="secondary">Mailed</Badge></TableCell>
                  </TableRow>
                   <TableRow>
                    <TableCell>Equifax</TableCell>
                    <TableCell>2024-07-10</TableCell>
                    <TableCell className="text-right"><Badge className="bg-accent text-accent-foreground hover:bg-accent/80">Delivered</Badge></TableCell>
                  </TableRow>
                   <TableRow>
                    <TableCell>TransUnion</TableCell>
                    <TableCell>2024-06-28</TableCell>
                    <TableCell className="text-right"><Badge className="bg-accent text-accent-foreground hover:bg-accent/80">Delivered</Badge></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            <Card className="flex flex-col items-center justify-center text-center p-6 bg-card/50">
                <CardHeader>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary animate-pulse">
                        <Upload className="h-8 w-8" />
                    </div>
                    <CardTitle className="font-headline">Analyze a New Report</CardTitle>
                    <CardDescription>
                        Upload your latest credit report PDF to get an updated analysis and find new opportunities.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                       <Link href="/reports">
                        <Upload className="mr-2 h-4 w-4" /> Upload Report
                       </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}
