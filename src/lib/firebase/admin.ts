import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

let adminApp: App;

/**
 * Validasi bahwa Firebase Admin credentials tersedia dan valid.
 * Throw error yang jelas jika MOCK_KEY atau credential tidak lengkap.
 */
function validateAdminCredentials(): void {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  if (!projectId) {
    throw new Error(
      "[Firebase Admin] FIREBASE_ADMIN_PROJECT_ID tidak ditemukan di environment. " +
      "Pastikan .env.local sudah diisi dengan benar."
    );
  }

  if (!clientEmail) {
    throw new Error(
      "[Firebase Admin] FIREBASE_ADMIN_CLIENT_EMAIL tidak ditemukan di environment. " +
      "Dapatkan dari Firebase Console → Project Settings → Service Accounts."
    );
  }

  if (!privateKey) {
    throw new Error(
      "[Firebase Admin] FIREBASE_ADMIN_PRIVATE_KEY tidak ditemukan di environment. " +
      "Dapatkan dari Firebase Console → Project Settings → Service Accounts → Generate New Private Key."
    );
  }

  if (privateKey.includes("MOCK_KEY")) {
    throw new Error(
      "[Firebase Admin] FIREBASE_ADMIN_PRIVATE_KEY masih menggunakan MOCK_KEY! " +
      "Sistem tidak dapat berjalan dalam mode production dengan kunci palsu. " +
      "Ganti dengan private key asli dari Firebase Console → Project Settings → Service Accounts."
    );
  }

  if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    throw new Error(
      "[Firebase Admin] Format FIREBASE_ADMIN_PRIVATE_KEY tidak valid. " +
      "Private key harus dimulai dengan '-----BEGIN PRIVATE KEY-----'."
    );
  }
}

/**
 * Mengecek apakah Firebase Admin credentials telah terkonfigurasi secara valid
 */
export function isFirebaseAdminConfigured(): boolean {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  return Boolean(
    projectId &&
    clientEmail &&
    privateKey &&
    !privateKey.includes("MOCK_KEY") &&
    privateKey.includes("-----BEGIN PRIVATE KEY-----")
  );
}

function getAdminApp(): App {
  if (getApps().length === 0) {
    validateAdminCredentials();

    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY!;

    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } else {
    adminApp = getApps()[0];
  }
  return adminApp;
}

const databaseId = process.env.FIREBASE_DATABASE_ID || "presensi-pegawai";

// Export lazy Proxy agar modul aman di-import tanpa melempar crash fatal di dev mode
export const adminDb = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(_target, prop) {
    const db = getFirestore(getAdminApp(), databaseId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (db as any)[prop];
    return typeof val === "function" ? val.bind(db) : val;
  },
});

export const adminAuth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(_target, prop) {
    const auth = getAuth(getAdminApp());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (auth as any)[prop];
    return typeof val === "function" ? val.bind(auth) : val;
  },
});

export const adminStorage = new Proxy({} as ReturnType<typeof getStorage>, {
  get(_target, prop) {
    const storage = getStorage(getAdminApp());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (storage as any)[prop];
    return typeof val === "function" ? val.bind(storage) : val;
  },
});

