import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

let adminApp: App;

function getAdminApp(): App {
  if (getApps().length === 0) {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    const isRealPrivateKey = Boolean(
      privateKey &&
      !privateKey.includes("MOCK_KEY") &&
      privateKey.includes("-----BEGIN PRIVATE KEY-----")
    );

    if (
      isRealPrivateKey &&
      process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL
    ) {
      try {
        adminApp = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: privateKey!.replace(/\\n/g, "\n"),
          }),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
      } catch (err) {
        console.warn("[Firebase Admin] Gagal parse cert, fallback ke mock app:", err);
        adminApp = initializeApp({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "teknopark-surakarta",
        });
      }
    } else {
      adminApp = initializeApp({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "teknopark-surakarta",
      });
    }
  } else {
    adminApp = getApps()[0];
  }
  return adminApp;
}

const databaseId = process.env.FIREBASE_DATABASE_ID || "presensi-pegawai";

export const adminDb = getFirestore(getAdminApp(), databaseId);
export const adminAuth = getAuth(getAdminApp());
export const adminStorage = getStorage(getAdminApp());
