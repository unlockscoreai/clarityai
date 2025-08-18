
// This file is gitignored. In a real project, you would download your service account key
// from the Firebase console and place it here. For this environment, we'll use a placeholder.
// DO NOT COMMIT YOUR REAL SERVICE ACCOUNT KEY TO A PUBLIC REPOSITORY.

import type { ServiceAccount } from 'firebase-admin/app';

// This configuration is now type-safe and directly usable by the Firebase Admin SDK's cert() function.
export const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};
