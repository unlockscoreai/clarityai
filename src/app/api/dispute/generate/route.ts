
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateCreditDisputeLetter, GenerateCreditDisputeLetterInputSchema } from '@/ai/flows/dispute-letter-generator';
import { auth as adminAuth, adminDB } from '@/lib/firebase/server';
import { doc, runTransaction, serverTimestamp, collection, addDoc, increment } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await req.json();
    const input = GenerateCreditDisputeLetterInputSchema.parse(body);

    const userDocRef = doc(adminDB, "users", userId);

    let letterPackage;

    await runTransaction(adminDB, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) {
            throw new Error("User document not found.");
        }
        const currentCredits = userDoc.data().credits || 0;
        if (currentCredits < 1) {
            throw new Error("Insufficient credits.");
        }

        // Call the AI flow to get the letter package
        letterPackage = await generateCreditDisputeLetter(input);
        
        // Add the generated letter to the letters subcollection
        const lettersCollectionRef = collection(adminDB, "letters");
        await addDoc(lettersCollectionRef, {
            userId: userId,
            letterPackage,
            createdAt: serverTimestamp(),
        });
        
        // Decrement user's credits
        transaction.update(userDocRef, {
            credits: increment(-1),
            updatedAt: serverTimestamp()
        });
    });

    if (!letterPackage) {
      throw new Error("Failed to generate and save letter package.");
    }

    return NextResponse.json(letterPackage);

  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input.', details: err.format() }, { status: 400 });
    }
    
    if (err.code === 'auth/id-token-expired' || err.code === 'auth/argument-error') {
         return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    
    console.error('[API/DISPUTE/GENERATE] Flow execution error:', err);
    return NextResponse.json({ error: err.message || 'Flow execution failed' }, { status: 500 });
  }
}
