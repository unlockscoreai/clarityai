
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { auth as adminAuth, adminDB } from '@/lib/firebase/server';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    const disputeId = params.id;

    if (!disputeId) {
      return NextResponse.json({ error: 'Dispute ID is required' }, { status: 400 });
    }

    const disputeRef = doc(adminDB, 'disputes', disputeId);
    const disputeSnap = await getDoc(disputeRef);

    if (!disputeSnap.exists()) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    const disputeData = disputeSnap.data();
    if (disputeData.userId !== userId) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    return NextResponse.json({
        id: disputeData.id,
        status: disputeData.status,
        createdAt: disputeData.createdAt,
        errorMessage: disputeData.errorMessage || null,
    });

  } catch (error: any) {
    console.error(`Error fetching dispute status for ${params.id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
