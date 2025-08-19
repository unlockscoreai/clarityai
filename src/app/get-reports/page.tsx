
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, AlertTriangle, GanttChartSquare } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import React from "react";

const premiumSources = [
  {
    name: "IdentityIQ",
    description: "A popular choice for comprehensive 3-bureau reports and scores, updated monthly. Often recommended for serious credit repair efforts.",
    url: "https://www.identityiq.com/",
  },
  {
    name: "MyFICO",
    description: "Provides official FICO scores from all three bureaus, which can be different from the VantageScores provided by free services.",
    url: "https://www.myfico.com/",
  },
  {
    name: "Credit Hero Challenge",
    description: "Offers 3-bureau reports as part of a larger credit repair training program. Good for those who want to learn while they repair.",
    url: "https://creditherochallenge.com/",
  },
   {
    name: "Experian (Paid Plan)",
    description: "Experian's premium service provides daily updates and 3-bureau reporting, along with identity theft protection features.",
    url: "https://www.experian.com/consumer-products/credit-monitoring.html",
  },
];

const freeSources = [
  {
    name: "Credit Karma",
    description: "Provides free weekly reports and VantageScores from TransUnion and Equifax. A great tool for regular monitoring.",
    url: "https://www.creditkarma.com/",
  },
  {
    name: "Experian (Free Plan)",
    description: "Get your free Experian credit report and FICO score, updated monthly. You will need this to see your Experian data.",
    url: "https://www.experian.com/consumer-products/free-credit-report.html",
  },
  {
    name: "AnnualCreditReport.com",
    description: "The only source for your free credit reports authorized by federal law. You can get a free copy from each bureau once a year.",
    url: "https://www.annualcreditreport.com/",
  },
];

function LogoIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
        </svg>
    );
}

export default function GetCreditReportsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
       <header className="px-4 lg:px-6 h-14 flex items-center bg-card border-b">
            <Link href="/" className="flex items-center justify-center gap-2">
                <LogoIcon className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">Credit Clarity AI</span>
            </Link>
            <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
                <Button asChild variant="link">
                    <Link href="/affiliate/signup">Become an Affiliate</Link>
                </Button>
                <Button asChild variant="ghost">
                    <Link href="/login">Log In</Link>
                </Button>
                <Button asChild>
                    <Link href="/signup">Get Started</Link>
                </Button>
            </nav>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="space-y-6 max-w-6xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2">
                    <FileText className="h-6 w-6 text-primary" />
                    Get Your Credit Reports
                  </CardTitle>
                  <CardDescription>
                    To dispute items effectively, you need a complete picture of your credit. Use these resources to obtain your reports.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Important: Use a 3-Bureau Report for Best Results</AlertTitle>
                    <AlertDescription>
                      For our AI to work effectively, we need to see your data from all three major bureaus: Experian, TransUnion, and Equifax. Premium services provide this in a single report. If you use free services, you will need to combine reports from <strong>Credit Karma</strong> (for TransUnion/Equifax) and <strong>Experian's free plan</strong> to get a complete view.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <h3 className="text-xl font-semibold mb-4 font-headline">Premium 3-Bureau Reports (Recommended)</h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      {premiumSources.map((source) => (
                        <Card key={source.name} className="flex flex-col">
                          <CardHeader>
                            <CardTitle className="text-lg">{source.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="flex-grow">
                            <p className="text-muted-foreground">{source.description}</p>
                          </CardContent>
                          <CardFooter>
                            <Button asChild variant="outline" className="w-full">
                                <a href={source.url} target="_blank" rel="noopener noreferrer">
                                    Visit Website
                                    <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-4 font-headline">Free Reporting Options</h3>
                     <div className="grid gap-6 md:grid-cols-2">
                      {freeSources.map((source) => (
                        <Card key={source.name} className="flex flex-col">
                          <CardHeader>
                            <CardTitle className="text-lg">{source.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="flex-grow">
                            <p className="text-muted-foreground">{source.description}</p>
                          </CardContent>
                           <CardFooter>
                            <Button asChild variant="outline" className="w-full">
                                <a href={source.url} target="_blank" rel="noopener noreferrer">
                                    Visit Website
                                    <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
        </main>
         <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
            <p className="text-xs text-muted-foreground">&copy; 2024 Credit Clarity AI. All rights reserved.</p>
            <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                    Terms of Service
                </Link>
                <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
                    Privacy
                </Link>
            </nav>
        </footer>
    </div>
  );
}
