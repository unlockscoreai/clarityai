"use client";
import React, { useState } from "react";
import { createUploadUrl, createDispute, getDispute } from "@/lib/api";
import { AppLayout } from "@/components/app-layout";

export default function NewDispute() {
  const [file, setFile] = useState<File | null>(null);
  const [reportId, setReportId] = useState<string>("");
  const [disputeId, setDisputeId] = useState<string>("");
  const [status, setStatus] = useState<string>("idle");
  const [log, setLog] = useState<string>("Welcome! Select a PDF to begin.");

  async function handleUpload() {
    if (!file) return alert("Select a PDF credit report first.");
    setLog(""); // Clear logs on new upload
    setStatus("requesting-upload-url");
    setLog((l) => l + `Requesting secure upload location...\n`);
    const { reportId, uploadUrl } = await createUploadUrl();
    setReportId(reportId);
    setLog((l) => l + `Secure location received for report ${reportId}.\n`);

    setStatus("uploading");
    setLog((l) => l + `Uploading file securely...\n`);
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/pdf" },
      body: file,
    });
    if (!putRes.ok) throw new Error("Upload failed");
    setLog((l) => l + `Upload complete.\n`);

    setStatus("creating-dispute");
    setLog((l) => l + `Starting analysis and dispute creation...\n`);
    const { disputeId, status } = await createDispute(reportId);
    setDisputeId(disputeId);
    setLog((l) => l + `Dispute created: ${disputeId} (${status})\n`);

    setStatus("queued");
    poll(disputeId);
  }

  async function poll(id: string) {
    setStatus("processing");
    setLog((l) => l + `Polling for status updates...\n`);
    const interval = setInterval(async () => {
      const d = await getDispute(id);
      setLog((l) => l + `Status: ${d.status}\n`);
      if (["letters_ready","mailed","completed","error"].includes(d.status)) {
        clearInterval(interval);
        setStatus(d.status);
      }
    }, 4000);
  }

  return (
    <AppLayout>
        <div style={{maxWidth:800, margin:"10px auto", fontFamily:"system-ui"}}>
        <h1>Start a Dispute</h1>
        <p>Upload your credit report PDF, then we’ll parse, generate letters, and send certified mail.</p>
        <input type="file" accept="application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)} />
        <button onClick={handleUpload} disabled={!file || status !== 'idle'} style={{marginLeft:12}}>
            {status === 'idle' ? 'Upload & Create Dispute' : 'Processing...'}
        </button>
        <div style={{marginTop:16}}>
            <div><b>Report:</b> {reportId||"—"}</div>
            <div><b>Dispute:</b> {disputeId||"—"}</div>
            <div><b>Status:</b> {status}</div>
            <pre style={{background:"#f7f7f7", padding:12, whiteSpace:"pre-wrap", marginTop: 12, height: 300, overflowY: 'auto', border: '1px solid #eee' }}>{log}</pre>
        </div>
        </div>
    </AppLayout>
  );
}
