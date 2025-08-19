
'use server';

import { config } from 'dotenv';
config();

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeCreditProfile } from '@/ai/flows/credit-report-analyzer';
import { auth as adminAuth } from '@/lib/firebase/server';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    
    let userId = 'anonymous_signup'; // Default user for initial analysis
    if (token) {
        const decodedToken = await adminAuth.verifyIdToken(token);
        userId = decodedToken.uid;
    }

    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid content type. Must be multipart/form-data.' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // Convert file to a data URI
    const fileBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(fileBuffer).toString('base64');
    const dataUri = `data:${file.type};base64,${base64String}`;

    const input = {
      creditReportDataUri: dataUri,
    };

    const response = await analyzeCreditProfile(input);
    
    // The creditReportDataUri is no longer needed in the response,
    // as it's not being saved directly anymore.
    // We only pass the gsUri when we save to storage.
    return NextResponse.json(response);

  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input.', details: err.format() }, { status: 400 });
    }
    
    if (err.code === 'auth/id-token-expired' || err.code === 'auth/argument-error') {
         return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    console.error('[API/ANALYZE] Flow execution error:', err);
    return NextResponse.json({ error: err.message || 'Flow execution failed' }, { status: 500 });
  }
}
