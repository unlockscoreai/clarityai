
'use server';

import { config } from 'dotenv';
config();

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeCreditProfile } from '@/ai/flows/credit-report-analyzer';
import { getStorage } from 'firebase-admin/storage';
import { auth as adminAuth } from '@/lib/firebase/server';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    
    // During signup, a token might not be available yet.
    // In a production app, this endpoint should be protected,
    // e.g., with App Check or a temporary captcha-verified token.
    // For this flow, we'll proceed if no token is provided.
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

    // Upload file to Firebase Storage
    const storage = getStorage();
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
        throw new Error("Firebase Storage bucket name is not configured in environment variables.");
    }
    const bucket = storage.bucket(bucketName);
    const filePath = `reports/${userId}/${Date.now()}-${file.name}`;
    const fileRef = bucket.file(filePath);
    
    const fileBuffer = await file.arrayBuffer();
    await fileRef.save(Buffer.from(fileBuffer), {
        contentType: file.type
    });

    const gsUri = `gs://${bucket.name}/${filePath}`;

    const input = {
      creditReportGsUri: gsUri,
    };

    const response = await analyzeCreditProfile(input);
    
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
