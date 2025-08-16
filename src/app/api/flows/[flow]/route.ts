
// src/app/api/flows/[flow]/route.ts
'use server';
import { NextRequest, NextResponse } from 'next/server';
import { createFlowsEndpoint } from '@/ai/flows/flow-engine';
import '@/ai/dev'; // This ensures all flows are registered
import { auth } from '@/lib/firebase/server';

async function getAuthenticatedUid(req: NextRequest): Promise<string | null> {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!token) {
        return null;
    }
    try {
        const decodedToken = await auth.verifyIdToken(token);
        return decodedToken.uid;
    } catch (error) {
        console.error("Invalid auth token:", error);
        return null;
    }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { flow: string } }
) {
  const { flow } = params;

  const isPublicFlow = flow === 'analyzeCreditProfileFlow';
  let uid: string | null = null;

  if (!isPublicFlow) {
      uid = await getAuthenticatedUid(req);
      if (!uid) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  }

  try {
    const contentType = req.headers.get('content-type');
    let input: any;

    if (contentType?.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }
      
      const fileBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(fileBuffer).toString('base64');
      const dataUri = `data:${file.type};base64,${base64}`;
      
      // The new flow expects a data URI.
      input = {
        creditReportDataUri: dataUri,
      };

    } else {
      // For JSON bodies
      input = await req.json();
    }

    // Pass auth context to the flow if the user is authenticated
    const context = uid ? { auth: { uid } } : undefined;

    // Use the flow name from the URL, not a hardcoded one.
    const response = await createFlowsEndpoint(flow, input, context);
    return NextResponse.json(response);

  } catch (err: any) {
    console.error(`[${flow}] Flow execution error:`, err);
    return NextResponse.json({ error: err.message || 'Flow execution failed' }, { status: 500 });
  }
}
