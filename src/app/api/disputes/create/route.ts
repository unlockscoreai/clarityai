
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { auth as adminAuth, adminDB } from '@/lib/firebase/server';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, collection, runTransaction, increment } from 'firebase/firestore';
import { analyzeCreditProfile } from '@/ai/flows/credit-report-analyzer';
import { generateCreditDisputeLetter } from '@/ai/flows/dispute-letter-generator';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { reportId } = await req.json();
    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 });
    }
    
    const userRef = doc(adminDB, 'users', userId);
    const reportRef = doc(adminDB, 'reports', reportId);
    
    let disputeId = '';

    await runTransaction(adminDB, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const reportDoc = await transaction.get(reportRef);

        if (!userDoc.exists()) throw new Error('User not found');
        if (!reportDoc.exists()) throw new Error('Report not found');
        
        const currentCredits = userDoc.data()?.credits || 0;
        if (currentCredits < 1) {
            throw new Error("Insufficient credits.");
        }
        if (reportDoc.data()?.userId !== userId) {
            throw new Error("Report does not belong to user.");
        }
        
        transaction.update(userRef, { credits: increment(-1) });

        // Create a new dispute document
        const disputeRef = doc(collection(adminDB, 'disputes'));
        disputeId = disputeRef.id;
        transaction.set(disputeRef, {
            id: disputeId,
            userId,
            reportId,
            status: 'queued',
            createdAt: serverTimestamp(),
        });
        
        // Update the report status
        transaction.update(reportRef, { status: 'processing' });
    });
    
    // Asynchronously trigger AI processing (simulating a worker)
    processDispute(reportId, disputeId, userId);

    return NextResponse.json({ disputeId, status: 'queued' });

  } catch (error: any) {
    console.error('Error creating dispute:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}


// This function simulates an async background worker task.
// In a real production system, this would be a separate Cloud Function/Run service.
async function processDispute(reportId: string, disputeId: string, userId: string) {
    const disputeRef = doc(adminDB, 'disputes', disputeId);
    const reportRef = doc(adminDB, 'reports', reportId);

    try {
        await updateDoc(disputeRef, { status: 'analyzing_report' });

        const reportDoc = await getDoc(reportRef);
        const gcsPath = reportDoc.data()?.gcsPath;
        if (!gcsPath) throw new Error('gcsPath not found on report');
        
        // Convert gs:// path to a data URI for the Genkit flow
        const fileBuffer = (await adminDB.storage().bucket().file(gcsPath).download())[0];
        const dataUri = `data:application/pdf;base64,${fileBuffer.toString('base64')}`;

        const analysisResult = await analyzeCreditProfile({ creditReportDataUri: dataUri });
        await updateDoc(reportRef, { ...analysisResult, status: 'analysis_complete' });
        
        await updateDoc(disputeRef, { status: 'generating_letters' });

        const userDoc = await getDoc(doc(adminDB, 'users', userId));
        const letterInput = {
            creditReportDataUri: dataUri,
            personalInformation: {
                fullName: userDoc.data()?.name || 'N/A',
                dob: userDoc.data()?.dob || 'N/A',
                address: userDoc.data()?.address || 'N/A'
            }
        };

        const letterPackage = await generateCreditDisputeLetter(letterInput);
        
        // Save letters to their own collection
        await setDoc(doc(adminDB, 'letters', disputeId), {
            userId,
            disputeId,
            letterPackage,
            createdAt: serverTimestamp(),
        });

        await updateDoc(disputeRef, { status: 'letters_ready' });
    } catch (error: any) {
        console.error(`[Worker Simulation] Error processing dispute ${disputeId}:`, error);
        await updateDoc(disputeRef, { status: 'error', errorMessage: error.message });
    }
}

