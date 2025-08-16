
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/server';
import { z } from 'zod';
import { GenerateCreditDisputeLetterInputSchema, generateCreditDisputeLetter } from '@/ai/flows/dispute-letter-generator';
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

async function getAuthUser(req: NextRequest) {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!token) return null;

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
    const body = await req.json();
    const input = GenerateCreditDisputeLetterInputSchema.parse(body);

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'User must be authenticated.' }, { status: 401 });
    }

    const userDocRef = doc(db, "users", authUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists() || userDocSnap.data().credits < 1) {
        return NextResponse.json({ error: 'Insufficient credits.' }, { status: 402 });
    }

    const result = await generateCreditDisputeLetter(input);
    
    // Deduct credit and save the generated letter package
    await updateDoc(userDocRef, {
        credits: increment(-1)
    });
    
    const lettersCollectionRef = collection(db, "letters");
    await addDoc(lettersCollectionRef, {
        userId: authUser.uid,
        letterPackage: result,
        createdAt: serverTimestamp(),
    });


    return NextResponse.json(result, { status: 200 });

  } catch (err: any) {
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
