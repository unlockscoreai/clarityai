
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

// The createAffiliate function is no longer needed as affiliate signup
// is handled on the client-side with Google Sign-In.
// This file is kept for potential future cloud functions.
