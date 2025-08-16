
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
import { UploadCloud, FileCheck, UserPlus, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/context/session-provider";
import { db, storage } from "@/lib/firebase/client";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export default function AffiliateAddClientPage() {
  const { user } = useSession();
  const { toast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [mailFile, setMailFile] = useState<File | null>(null);

  const handleFileUpload = (setter: React.Dispatch<React.SetStateAction<File | null>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setter(e.target.files[0]);
    } else {
      setter(null);
    }
  };
  
  const uploadFile = async (file: File, path: string): Promise<string> => {
      const fileRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(fileRef, file);

      return new Promise((resolve, reject) => {
          uploadTask.on(
              "state_changed",
              null,
              (error) => reject(error),
              async () => {
                  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                  resolve(downloadURL);
              }
          );
      });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in." });
        return;
    }
    if (!fullName || !email || !reportFile || !idFile || !mailFile) {
        toast({ variant: "destructive", title: "Missing Fields", description: "Please fill out all fields and upload all required documents."});
        return;
    }
    setLoading(true);

    try {
      const affiliateId = user.uid;
      const clientRef = doc(collection(db, "affiliates", affiliateId, "clients"));
      const clientId = clientRef.id;

      // Upload files in parallel
      const [reportURL, idURL, mailURL] = await Promise.all([
          uploadFile(reportFile, `affiliateClients/${affiliateId}/${clientId}/creditReport.pdf`),
          uploadFile(idFile, `affiliateClients/${affiliateId}/${clientId}/identity.pdf`),
          uploadFile(mailFile, `affiliateClients/${affiliateId}/${clientId}/proofOfMail.pdf`),
      ]);

      // Create client in Firestore
      await setDoc(clientRef, {
        name: fullName,
        email,
        address,
        creditReportURL: reportURL,
        idURL,
        mailURL,
        status: "pending_analysis",
        createdAt: serverTimestamp(),
        affiliateId,
      });

      toast({
          title: "Client Added Successfully",
          description: `${fullName} has been added to your list. Analysis will begin shortly.`,
      });
      router.push('/affiliate');

    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Error Adding Client", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const FileUploadInput = ({ id, label, file, onChange, required=true }: { id: string, label: string, file: File | null, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, required?: boolean }) => (
    <div className="space-y-2">
        <Label htmlFor={id}>{label}{required && ' *'}</Label>
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
              required={required}
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
                        <Input id="fullName" placeholder="John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder="client@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="address">Current Address</Label>
                    <Input
                    id="address"
                    placeholder="123 Main St, Anytown, USA 12345"
                    required
                    value={address} onChange={(e) => setAddress(e.target.value)}
                    />
                </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Document Upload</CardTitle>
                <CardDescription>
                    Upload the client's credit report, ID, and proof of mail. All documents are required.
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
                    <Button type="submit" className="w-full md:w-auto font-bold" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <UserPlus className="mr-2" />}
                        {loading ? "Adding Client..." : "Add Client and Start Analysis"}
                    </Button>
                </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
