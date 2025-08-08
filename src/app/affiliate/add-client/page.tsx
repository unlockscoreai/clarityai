
"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileCheck, UserPlus, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AffiliateAddClientPage() {
  const [idFile, setIdFile] = useState<File | null>(null);
  const [mailFile, setMailFile] = useState<File | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const { toast } = useToast();
  const router = useRouter();


  const handleFileUpload = (setter: React.Dispatch<React.SetStateAction<File | null>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setter(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle form submission logic here
    // In a real app, you would make an API call to your backend to handle the files and data.
    // This would create a new client record associated with the affiliate.
    console.log("Client intake form submitted");
    
    // On success, show a toast and redirect back to the affiliate dashboard
    toast({
        title: "Client Added Successfully",
        description: "The new client has been added to your management list.",
    });
    router.push('/affiliate');
  };

  const FileUploadInput = ({ id, label, file, onChange }: { id: string, label: string, file: File | null, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="flex items-center gap-4">
            <Button asChild variant="outline">
            <label htmlFor={id} className="cursor-pointer">
                <UploadCloud className="mr-2" />
                Upload File
            </label>
            </Button>
            <Input
            id={id}
            type="file"
            className="hidden"
            onChange={onChange}
            accept="image/*,.pdf"
            />
            {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileCheck className="h-5 w-5 text-green-600" />
                <span>{file.name}</span>
            </div>
            )}
        </div>
    </div>
  )

  return (
    <AppLayout>
      <div className="space-y-8 max-w-3xl mx-auto">
        <div>
            <Button asChild variant="outline" size="sm" className="mb-4">
                <Link href="/affiliate">
                    <ArrowLeft className="mr-2"/>
                    Back to Dashboard
                </Link>
            </Button>
          <h1 className="text-3xl font-headline font-bold">Affiliate Client Intake</h1>
          <p className="text-muted-foreground">
            Manually enter a new client's information to begin their credit repair journey.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            <Card>
                <CardHeader>
                <CardTitle>Client Details</CardTitle>
                <CardDescription>
                    Enter the client's personal and contact information.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" placeholder="John Doe" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder="client@example.com" required />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="address">Current Address</Label>
                    <Input
                    id="address"
                    placeholder="123 Main St, Anytown, USA 12345"
                    required
                    />
                </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Document Upload</CardTitle>
                <CardDescription>
                    Upload the client's credit report, ID, and proof of mail.
                </CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-1 gap-6">
                    <FileUploadInput id="report-upload" label="Credit Report (PDF)" file={reportFile} onChange={handleFileUpload(setReportFile)} />
                    <FileUploadInput id="id-upload" label="Driver's License / ID" file={idFile} onChange={handleFileUpload(setIdFile)} />
                    <FileUploadInput id="mail-upload" label="Proof of Mail" file={mailFile} onChange={handleFileUpload(setMailFile)} />
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Submit Client File</CardTitle>
                    <CardDescription>
                        Once submitted, the client will be added to your management list and their analysis will begin.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button type="submit" className="w-full md:w-auto font-bold">
                        <UserPlus className="mr-2" />
                        Add Client and Start Analysis
                    </Button>
                </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
