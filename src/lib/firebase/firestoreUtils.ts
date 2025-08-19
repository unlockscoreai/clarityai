
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import type { User } from "firebase/auth";

const db = getFirestore();

/**
 * Creates a user document in Firestore if one does not already exist.
 * This function is designed to be called after a user signs in.
 * @param user The Firebase Auth user object.
 */
export const createUserIfNotExists = async (user: User) => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // New user, create the document
    await setDoc(userRef, {
      uid: user.uid,
      name: user.displayName || '',
      email: user.email,
      createdAt: serverTimestamp(),
      credits: 1, // Welcome credit
      subscription: { plan: 'starter', status: 'active' },
    });
  }
  // If the document exists, do nothing.
};
