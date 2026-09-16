import {
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./config";
import { UserProfile, UserRole } from "@/types";
import { DEFAULT_STORAGE_LIMIT_BYTES } from "../utils";

import { SEED_USERS } from "@/data/seedData";

// Data Master Akun Demo ASN Terpadu (Solo Teknopark)
export const DEMO_USERS: Record<UserRole, UserProfile> = SEED_USERS;


/**
 * Normalisasi format NIP atau Email kedinasan menjadi format email standar Firebase Auth.
 * Contoh: '19920817 201801 1 002' -> '199208172018011002@asn.go.id'
 */
export function normalizeNipToEmail(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }
  // Bersihkan spasi dan tanda pemisah lainnya
  const cleanDigits = trimmed.replace(/\D/g, "");
  return `${cleanDigits}@asn.go.id`;
}

/**
 * Mengambil profil ASN dari koleksi Firestore `users/{uid}`
 */
export async function getUserProfileFromFirestore(
  uid: string
): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, "users", uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.warn("[Firebase] Gagal mengambil profil dari Firestore:", error);
    return null;
  }
}

/**
 * Menyimpan atau memperbarui profil ASN di Firestore `users/{uid}`
 */
export async function upsertUserProfileToFirestore(
  profile: UserProfile
): Promise<void> {
  try {
    const userDocRef = doc(db, "users", profile.id);
    await setDoc(
      userDocRef,
      {
        ...profile,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn("[Firebase] Gagal menyimpan profil ke Firestore:", error);
  }
}

/**
 * Mencari profil default berdasarkan NIP atau Email
 */
export function findDemoUserByNipOrEmail(
  nipOrEmail: string
): UserProfile | null {
  const normalized = normalizeNipToEmail(nipOrEmail);
  for (const role of Object.keys(DEMO_USERS) as UserRole[]) {
    const u = DEMO_USERS[role];
    if (
      normalizeNipToEmail(u.nip) === normalized ||
      u.email.toLowerCase() === nipOrEmail.trim().toLowerCase()
    ) {
      return u;
    }
  }
  return null;
}

/**
 * Autentikasi ASN via Firebase Auth dengan graceful dev fallback
 */
export async function loginWithNipOrEmail(
  nipOrEmail: string,
  password: string,
  preferredRole: UserRole = "pegawai"
): Promise<UserProfile> {
  const email = normalizeNipToEmail(nipOrEmail);

  // Coba login via Firebase Auth
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const fbUser: FirebaseUser = userCredential.user;

    // Ambil dokumen profil dari Firestore
    const profile = await getUserProfileFromFirestore(fbUser.uid);
    if (profile) {
      return profile;
    }

    // Jika belum ada di Firestore, buat profil baru berbasis data demo atau input
    const demoMatch = findDemoUserByNipOrEmail(nipOrEmail) || DEMO_USERS[preferredRole];
    const newProfile: UserProfile = {
      ...demoMatch,
      id: fbUser.uid,
      email: fbUser.email || email,
      nip: nipOrEmail.includes("@") ? demoMatch.nip : nipOrEmail,
    };

    await upsertUserProfileToFirestore(newProfile);
    return newProfile;
  } catch (firebaseError: unknown) {
    // Graceful fallback jika menggunakan demo/mock API key atau belum ada koneksi live
    console.info(
      "[Auth ASN] Firebase Auth live tidak aktif atau kredensial mock, menggunakan mode lokal simulasi:",
      (firebaseError as Error)?.message || firebaseError
    );

    // Cari kecocokan di demo user atau gunakan preferred role
    const matched = findDemoUserByNipOrEmail(nipOrEmail);
    if (matched) {
      return matched;
    }

    // Jika tidak ditemukan tapi sandi valid (simulasi), buat profil pegawai dinamis
    return {
      ...DEMO_USERS[preferredRole],
      nip: nipOrEmail,
      email: email,
    };
  }
}

/**
 * Sign out pengguna dari Firebase Auth dan hapus sesi
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn("[Firebase] Gagal logout:", error);
  }
}
