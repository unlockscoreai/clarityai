
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "credit-clarity-ai-3xl8s",
  appId: "1:925810683734:web:d0910772d7671868d4b0f7",
  storageBucket: "credit-clarity-ai-3xl8s.firebasestorage.app",
  apiKey: "AIzaSyAas1vTLl8pq5eYuBiyg1Db-l6Nq2YplPQ",
  authDomain: "credit-clarity-ai-3xl8s.firebaseapp.com",
  messagingSenderId: "925810683734",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
