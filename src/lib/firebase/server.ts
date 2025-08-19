
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { serviceAccount } from './service-account';

const app = getApps().length === 0
  ? initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    })
  : getApp();

export const auth = getAuth(app);
export const adminDB = getFirestore(app);
