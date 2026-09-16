import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA68rTg8CIf4483joidSU_kfaIu603Dx1Q",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "teknopark-surakarta.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "teknopark-surakarta",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "teknopark-surakarta.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "831800993201",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:831800993201:web:9bf7458a0d5aa9078f0990",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-2NM8FGG415",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Menggunakan named database presensi-pegawai
const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "presensi-pegawai";

export const auth = getAuth(app);
export const db = getFirestore(app, databaseId);
export const storage = getStorage(app);
export default app;
