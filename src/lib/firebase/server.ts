
import { initializeApp, getApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { credential } from 'firebase-admin';

let app: App;
if (getApps().length === 0) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    app = initializeApp({
      credential: credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
    });
  } else {
    // initialize without cert on client-side, useful for Storybook
    app = initializeApp();
  }
} else {
  app = getApp();
}

export const auth = getAuth(app);
