
'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BarChart, FileText, ShieldCheck } from "lucide-react";

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


export default function HomePage() {

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
                        <Button size="lg" className="font-bold" asChild>
                            <Link href="/signup">
                                Get Your Free Analysis <ArrowRight className="ml-2"/>
                            </Link>
                        </Button>
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
