
// This file is gitignored. In a real project, you would download your service account key
// from the Firebase console and place it here. For this environment, we'll use a placeholder.
// DO NOT COMMIT YOUR REAL SERVICE ACCOUNT KEY TO A PUBLIC REPOSITORY.

// This configuration is now type-safe and directly usable by the Firebase Admin SDK's cert() function.
export const serviceAccount = {
  projectId: process.env.PROJECT_ID,
  clientEmail: process.env.CLIENT_EMAIL,
  privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
};
