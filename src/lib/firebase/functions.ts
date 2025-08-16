
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

export const createAffiliate = functions.https.onCall(async (data, context) => {
  const { email, password, name, referralCode } = data;

  if (!email || !password || !name) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields: email, password, name."
    );
  }

  try {
    // 1. Create the Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });
    const uid = userRecord.uid;

    // 2. Prepare affiliate data
    const affiliateData: { [key: string]: any } = {
      name,
      email,
      clients: [],
      referrals: [],
      earnings: 0,
      credits: 1, // Initial credit bonus
      tier: 'Starter',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      referralLink: `https://creditclarity.ai/affiliate/signup?ref=${uid}`,
    };

    // 3. Handle referral logic within a transaction
    await db.runTransaction(async (transaction) => {
      let referrerId = null;
      if (referralCode) {
        const referrerRef = db.collection("affiliates").doc(referralCode);
        const referrerSnap = await transaction.get(referrerRef);
        if (referrerSnap.exists) {
          referrerId = referralCode;
          transaction.update(referrerRef, {
            referrals: admin.firestore.FieldValue.arrayUnion(uid),
            credits: admin.firestore.FieldValue.increment(1),
          });
        } else {
            // If the referral code is invalid, we don't throw an error,
            // we just proceed without the referral.
            console.warn(`Referral code ${referralCode} not found.`);
        }
      }
      affiliateData.referrerId = referrerId;
      
      // 4. Create the affiliate document in Firestore
      const affiliateRef = db.collection("affiliates").doc(uid);
      transaction.set(affiliateRef, affiliateData);
    });

    // 5. Generate a custom token for the new user to sign in
    const token = await auth.createCustomToken(uid);

    return { token };

  } catch (error: any) {
    // If user already exists, throw a specific error
    if (error.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError('already-exists', 'An account with this email already exists.');
    }
    console.error("Error creating affiliate:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An unexpected error occurred while creating the affiliate account."
    );
  }
});
