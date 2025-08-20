"use client";
import React, { useState } from "react";
import { createUploadUrl, createDispute, getDispute } from "@/lib/api";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function NewDispute() {
  const [file, setFile] = useState<File | null>(null);
  const [reportId, setReportId] = useState<string>("");
  const [disputeId, setDisputeId] = useState<string>("");
  const [status, setStatus] = useState<string>("idle");
  const [log, setLog] = useState<string[]>(["Welcome! Select a PDF to begin."]);
  const [processing, setProcessing] = useState(false);

  const addLog = (message: string) => {
    setLog(prev => [...prev, message]);
  }

  async function handleUpload() {
    if (!file) return alert("Select a PDF credit report first.");
    setLog(["Welcome! Select a PDF to begin."]); // Clear logs on new upload
    setProcessing(true);

    try {
        setStatus("requesting-upload-url");
        addLog(`Requesting secure upload location...`);
        const { reportId, uploadUrl } = await createUploadUrl();
        setReportId(reportId);
        addLog(`Secure location received for report ${reportId}.`);

        setStatus("uploading");
        addLog(`Uploading file securely...`);
        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "application/pdf" },
          body: file,
        });
        if (!putRes.ok) throw new Error("Upload failed");
        addLog(`Upload complete.`);

        setStatus("creating-dispute");
        addLog(`Starting analysis and dispute creation...`);
        const { disputeId, status } = await createDispute(reportId);
        setDisputeId(disputeId);
        addLog(`Dispute created: ${disputeId} (${status})`);

        setStatus("queued");
        poll(disputeId);
    } catch (error: any) {
        addLog(`Error: ${error.message}`);
        setStatus("error");
        setProcessing(false);
    }
  }

  async function poll(id: string) {
    setStatus("processing");
    addLog(`Polling for status updates...`);
    const interval = setInterval(async () => {
      try {
        const d = await getDispute(id);
        addLog(`Status: ${d.status}`);
        if (["letters_ready","mailed","completed","error"].includes(d.status)) {
          clearInterval(interval);
          setStatus(d.status);
          setProcessing(false);
        }
      } catch (pollError: any) {
         addLog(`Polling Error: ${pollError.message}`);
         clearInterval(interval);
         setStatus("error");
         setProcessing(false);
      }
    }, 4000);
  }

  return (
    <AppLayout>
        <div className="max-w-2xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Start a New Dispute</CardTitle>
                    <CardDescription>Upload your credit report PDF, and we’ll parse it, generate letters, and send them via certified mail.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="pdf-upload">Credit Report PDF</Label>
                        <Input id="pdf-upload" type="file" accept="application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)} disabled={processing} />
                     </div>
                    <Button onClick={handleUpload} disabled={!file || processing} className="w-full">
                        {processing ? <Loader2 className="animate-spin mr-2" /> : null}
                        {status === 'idle' ? 'Upload & Create Dispute' : 'Processing...'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Processing Log</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div><b>Report ID:</b> {reportId||"—"}</div>
                    <div><b>Dispute ID:</b> {disputeId||"—"}</div>
                    <div><b>Status:</b> <span className="font-mono p-1 bg-muted rounded-md">{status}</span></div>
                    <pre className="bg-secondary text-secondary-foreground p-4 rounded-md h-64 overflow-y-auto text-sm whitespace-pre-wrap">{log.join('\n')}</pre>
                </CardContent>
            </Card>
        </div>
    </AppLayout>
  );
}
