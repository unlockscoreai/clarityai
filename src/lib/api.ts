'use client';

import { auth } from '@/lib/firebase/client';

async function authFetch(path: string, init: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');

  const token = await user.getIdToken();
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body) {
    headers.set('Content-Type', 'application/json');
  }

  // Use relative path for API calls within the same Next.js app
  return fetch(`/api${path}`, { ...init, headers });
}

export async function createUploadUrl(tenantId?: string) {
  const res = await authFetch('/disputes/create-upload-url', {
    method: 'POST',
    body: JSON.stringify({ tenantId: tenantId || null }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    reportId: string;
    uploadUrl: string;
    gcsPath: string;
  }>;
}

export async function createDispute(reportId: string, tenantId?: string) {
  const res = await authFetch('/disputes/create', {
    method: 'POST',
    body: JSON.stringify({ reportId, tenantId: tenantId || null }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ disputeId: string; status: string }>;
}

export async function getDispute(id: string) {
  const res = await authFetch(`/disputes/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
