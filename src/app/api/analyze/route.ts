
'use server';

import { config } from 'dotenv';
config();

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeCreditProfile } from '@/ai/flows/credit-report-analyzer';
import { auth as adminAuth, adminBucket } from '@/lib/firebase/server';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    
    // During signup, a token might not be available yet.
    // For this flow, we'll proceed if no token is provided,
    // using a default user ID.
    let userId = 'anonymous_signup'; 
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
    
    // Throw an error if the bucket name is not configured
    if (!adminBucket.name) {
        throw new Error("Firebase Storage bucket name is not configured in environment variables.");
    }

    // Upload file to Firebase Storage
    const filePath = `reports/${userId}/${Date.now()}-${file.name}`;
    const fileRef = adminBucket.file(filePath);
    
    const fileBuffer = await file.arrayBuffer();
    await fileRef.save(Buffer.from(fileBuffer), {
        contentType: file.type
    });

    const gsUri = `gs://${adminBucket.name}/${filePath}`;

    const input = {
      creditReportGsUri: gsUri,
    };

    const response = await analyzeCreditProfile(input);
    
    // Attach the gsUri to the response so we can save it in the firestore doc
    const responseWithUri = { ...response, creditReportDataUri: gsUri };

    return NextResponse.json(responseWithUri);

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
