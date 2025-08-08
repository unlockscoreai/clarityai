
'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BarChart, FileText, ShieldCheck, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import React, { useState, useMemo } from "react";
import { useStreamFlow } from '@genkit-ai/next/client';
import { analyzeCreditReport, AnalyzeCreditReportInput, AnalyzeCreditReportOutput } from "@/ai/flows/credit-report-analyzer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


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

const features = [
  {
    icon: FileText,
    title: 'AI-Powered Analysis',
    description: 'Upload your credit report and get a detailed, personalized analysis in minutes.',
  },
  {
    icon: BarChart,
    title: 'Actionable Insights',
    description: 'Receive a clear, step-by-step action plan to improve your credit score effectively.',
  },
    {
    icon: ShieldCheck,
    title: 'Secure & Confidential',
    description: 'Your data is encrypted and handled with the utmost security and privacy.',
    },
];

function FreeAnalysisForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [reportFile, setReportFile] = useState<File | null>(null);
  
  const { stream, start, loading } = useStreamFlow(analyzeCreditReport);

  const analysis = useMemo(() => {
    let lastPiece: AnalyzeCreditReportOutput | undefined;
    for (const piece of stream) {
      if (piece.output) {
        lastPiece = piece.output;
      }
    }
    return lastPiece;
  }, [stream]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setReportFile(e.target.files[0]);
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reportFile) {
      // Add user-facing error handling
      console.error("No report file selected");
      return;
    }

    try {
      const creditReportDataUri = await fileToDataUri(reportFile);
      const input: AnalyzeCreditReportInput = { creditReportDataUri };
      start(input);
    } catch (error) {
      console.error("Analysis failed:", error);
      // Add user-facing error handling
    }
  };
  
  const handleCreateAccount = () => {
    // In a real app, you would pass the user data and maybe the analysis ID
    // to the signup page, e.g., via query params or state management.
    router.push('/signup');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-2xl font-semibold font-headline">Analyzing Your Report...</h2>
        <p className="text-muted-foreground text-center">This may take a moment. We're generating your personalized credit insights.</p>
      </div>
    );
  }

  if (analysis) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Your Analysis Snapshot is Ready!</DialogTitle>
          <DialogDescription>
            Here's a glimpse of your results. Create an account to view the full, detailed breakdown and start disputing items.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="prose prose-sm max-w-none rounded-lg border bg-secondary/50 p-4 h-64 overflow-y-auto" dangerouslySetInnerHTML={{ __html: analysis.analysisHtml }} />
          <div className="space-y-2">
            <Label htmlFor="password">Create a Password</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
        </div>
        <div className="flex justify-end">
            <Button onClick={handleCreateAccount} className="font-bold">
                See Full Analysis & Create Account <ArrowRight className="ml-2"/>
            </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Get Your Free AI Credit Analysis</DialogTitle>
        <DialogDescription>
          Provide your details and upload your credit report PDF to get started.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first-name">First Name</Label>
            <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last-name">Last Name</Label>
            <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="credit-report">Credit Report (PDF)</Label>
          <Input id="credit-report" type="file" accept=".pdf" onChange={handleFileChange} required />
        </div>
        <div className="flex justify-end">
            <Button type="submit" disabled={!reportFile || loading} className="font-bold">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</> : 'Get My Analysis'}
            </Button>
        </div>
      </form>
    </>
  );
}


export default function HomePage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
       <header className="px-4 lg:px-6 h-14 flex items-center bg-card border-b">
            <Link href="/" className="flex items-center justify-center gap-2">
                <LogoIcon className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">Credit Clarity AI</span>
            </Link>
            <nav className="ml-auto flex gap-4 sm:gap-6">
                <Button asChild variant="ghost">
                    <Link href="/login">Log In</Link>
                </Button>
                <Button asChild>
                    <Link href="/signup">Get Started</Link>
                </Button>
            </nav>
        </header>
        <main className="flex-1">
            <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-background to-blue-100 dark:from-background dark:to-blue-950/20">
                <div className="container px-4 md:px-6 text-center">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline text-primary">
                            Understand and Improve Your Credit Score with AI
                        </h1>
                        <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                            Get a free, in-depth analysis of your credit report and a personalized action plan to boost your score. No credit card required.
                        </p>
                         <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button size="lg" className="font-bold">
                                    Get Your Free Analysis <ArrowRight className="ml-2"/>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                               <FreeAnalysisForm setOpen={setOpen} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </section>

             <section className="w-full py-12 md:py-24 lg:py-32 bg-card">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">How It Works</h2>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                Our simple, secure process gives you the clarity you need to take control of your credit.
                            </p>
                        </div>
                    </div>
                    <div className="mx-auto grid max-w-5xl items-start gap-12 sm:grid-cols-3 md:gap-16 mt-12">
                        {features.map((feature) => (
                            <div key={feature.title} className="flex flex-col items-center text-center gap-4">
                                <div className="bg-primary/10 p-4 rounded-full">
                                    <feature.icon className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold font-headline">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
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
