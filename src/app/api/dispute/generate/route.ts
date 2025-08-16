
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { generateCreditDisputeLetter, GenerateCreditDisputeLetterInputSchema } from '@/ai/flows/dispute-letter-generator';
import { auth } from '@/lib/firebase/server';
import { z } from 'zod';


async function getAuthUser(req: NextRequest) {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!token) {
        return null;
    }
    try {
        const decodedToken = await auth.verifyIdToken(token);
        return { uid: decodedToken.uid, ...decodedToken };
    } catch (error) {
        console.error("Invalid auth token:", error);
        return null;
    }
}


export async function POST(req: NextRequest) {
  try {
    // 1. Parse request body
    const body = await req.json();

    // 2. Validate input
    const input = GenerateCreditDisputeLetterInputSchema.parse(body);

    // 3. Get authenticated user
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'User must be authenticated.' }, { status: 401 });
    }

    // 4. Call dispute letter generator with auth context
    const result = await generateCreditDisputeLetter(input, { auth: authUser });

    // 5. Return result
    return NextResponse.json(result, { status: 200 });

  } catch (err: any) {
    // Handle Zod validation errors
    if (err instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid input.', details: err.format() }, { status: 400 });
    }
    
    console.error('Error generating dispute letter:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate dispute letter.' },
      { status: 500 }
    );
  }
}
