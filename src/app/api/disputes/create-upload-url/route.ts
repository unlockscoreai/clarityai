
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { auth as adminAuth, adminDB, adminBucket } from '@/lib/firebase/server';
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const token = req.headers.get('authorization')?.split('Bearer ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;

        const reportId = uuidv4();
        const gcsPath = `user-reports/${userId}/${reportId}.pdf`;

        // Create a document in Firestore first
        const reportRef = doc(adminDB, 'reports', reportId);
        await setDoc(reportRef, {
            id: reportId,
            userId: userId,
            status: 'upload_pending',
            createdAt: serverTimestamp(),
            gcsPath: gcsPath
        });

        // Get a signed URL for the client to upload the file
        const [uploadUrl] = await adminBucket.file(gcsPath).getSignedUrl({
            version: 'v4',
            action: 'write',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
            contentType: 'application/pdf',
        });
        
        return NextResponse.json({ reportId, uploadUrl, gcsPath });

    } catch (error: any) {
        console.error('Error creating upload URL:', error);
        if (error.code === 'auth/id-token-expired') {
            return NextResponse.json({ error: 'Token expired, please log in again.' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
