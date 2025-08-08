
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
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UploadCloud, FileCheck, Info, CreditCard } from "lucide-react";
import Link from "next/link";

export default function OnboardingPage() {
  const [credits, setCredits] = useState(0); // Mock credits state. 0 for disabled, >0 for enabled.
  const [autoMailer, setAutoMailer] = useState(false);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [mailFile, setMailFile] = useState<File | null>(null);

  const affiliateName = "Jane Doe"; // Mock affiliate name

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setIdFile(e.target.files[0]);
    }
  };

  const handleMailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMailFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log("Form submitted");
    // In a real app, you would make an API call to your backend to handle the files and data.
    // If automailer is enabled, you would trigger the doupost service.
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-3xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-headline font-bold">Client Onboarding</h1>
          <p className="text-muted-foreground">
            Complete these steps to get your file ready for review.
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Referred by {affiliateName}</AlertTitle>
          <AlertDescription>
            Your affiliate partner is here to help you on your credit journey.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>1. Personal Information</CardTitle>
              <CardDescription>
                Please provide the following details. This information is kept
                secure and is only used for your credit file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ssn">Last 4 of Social Security</Label>
                  <Input id="ssn" placeholder="XXXX" maxLength={4} required />
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

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>2. Document Upload</CardTitle>
              <CardDescription>
                Upload a clear copy of your driver's license/ID and a recent
                proof of mail (like a utility bill).
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="id-upload">Driver's License / ID</Label>
                <div className="flex items-center gap-4">
                  <Button asChild variant="outline">
                    <label htmlFor="id-upload" className="cursor-pointer">
                      <UploadCloud className="mr-2" />
                      Upload File
                    </label>
                  </Button>
                  <Input
                    id="id-upload"
                    type="file"
                    className="hidden"
                    onChange={handleIdUpload}
                    accept="image/*,.pdf"
                  />
                  {idFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileCheck className="h-5 w-5 text-green-600" />
                      <span>{idFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mail-upload">Proof of Mail</Label>
                 <div className="flex items-center gap-4">
                  <Button asChild variant="outline">
                    <label htmlFor="mail-upload" className="cursor-pointer">
                      <UploadCloud className="mr-2" />
                      Upload File
                    </label>
                  </Button>
                  <Input
                    id="mail-upload"
                    type="file"
                    className="hidden"
                    onChange={handleMailUpload}
                    accept="image/*,.pdf"
                  />
                  {mailFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileCheck className="h-5 w-5 text-green-600" />
                      <span>{mailFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>3. Automailer Service</CardTitle>
              <CardDescription>
                Enable our automailer to have your dispute letters printed and
                shipped automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-4 rounded-md border p-4">
                    <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">Activate Automailer</p>
                        <p className="text-sm text-muted-foreground">
                        Automatically mail your dispute letters via certified mail.
                        </p>
                    </div>
                    <Switch
                        checked={autoMailer}
                        onCheckedChange={setAutoMailer}
                        disabled={credits === 0}
                    />
                </div>
                {credits === 0 && (
                     <Alert variant="destructive" className="mt-4">
                        <CreditCard className="h-4 w-4" />
                        <AlertTitle>No Credits Remaining</AlertTitle>
                        <AlertDescription>
                           You must have at least 1 credit to use the automailer service.
                           <Button asChild variant="link" className="p-0 h-auto ml-1">
                                <Link href="/credits">Purchase more credits.</Link>
                           </Button>
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter>
                 <Button type="submit" className="w-full font-bold">
                    Complete Onboarding & Review File
                 </Button>
            </CardFooter>
          </Card>

        </form>
      </div>
    </AppLayout>
  );
}
