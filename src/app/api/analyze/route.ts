'use server';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeCreditProfile } from '@/ai/flows/credit-report-analyzer';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type');

    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid content type. Must be multipart/form-data.' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // Convert file to data URI
    const fileBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(fileBuffer).toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    const input = {
      creditReportDataUri: dataUri,
    };

    const response = await analyzeCreditProfile(input);
    
    return NextResponse.json(response);

  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input.', details: err.format() }, { status: 400 });
    }
    
    console.error('[API/ANALYZE] Flow execution error:', err);
    return NextResponse.json({ error: err.message || 'Flow execution failed' }, { status: 500 });
  }
}
