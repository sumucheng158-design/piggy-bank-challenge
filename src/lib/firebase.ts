import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

const missing = [
  !apiKey && "NEXT_PUBLIC_FIREBASE_API_KEY",
  !authDomain && "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  !projectId && "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  !storageBucket && "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  !messagingSenderId && "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  !appId && "NEXT_PUBLIC_FIREBASE_APP_ID",
].filter(Boolean);

if (missing.length > 0) {
  throw new Error(
    `[Firebase] 缺少必要的環境變數，請確認 .env.local 設定：\n${missing.join("\n")}`
  );
}

const firebaseConfig = { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId };

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
