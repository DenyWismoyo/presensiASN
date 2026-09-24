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
import { UserProfile } from "@/types";

/**
 * Normalisasi format NIP atau Email menjadi format email standar Firebase Auth.
 * Contoh: '19920817 201801 1 002' -> '199208172018011002@pegawai.app'
 */
export function normalizeNipToEmail(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }
  // Bersihkan spasi dan tanda pemisah lainnya
  const cleanDigits = trimmed.replace(/\D/g, "");
  return `${cleanDigits}@pegawai.app`;
}

import { getDevUserProfile } from "@/data/seedData";

/**
 * Mengambil profil user/pegawai dari koleksi Firestore `users/{uid}`
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
  } catch (error) {
    console.warn("[Firebase] Gagal mengambil profil dari Firestore:", error);
  }

  // Mode Development: gunakan profil Seed jika Firestore belum terisi atau terhalang security rules
  if (process.env.NODE_ENV === "development") {
    const devProfile = getDevUserProfile(uid);
    if (devProfile) {
      return devProfile;
    }
  }

  return null;
}

/**
 * Menyimpan atau memperbarui profil pegawai di Firestore `users/{uid}`
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

import { lookupEmailByAccessCode } from "@/actions/auth";

/**
 * Autentikasi user via Firebase Auth.
 * Tidak ada fallback simulasi — jika gagal, error dilempar ke UI.
 *
 * @throws Error jika kredensial tidak valid atau Firebase tidak tersedia
 */
export async function loginWithNipOrEmail(
  nipOrEmail: string,
  password: string,
): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  let email = nipOrEmail.trim();

  // Jika input tidak mengandung @, bisa jadi NIP atau Access Code (misal STP001)
  if (!email.includes("@")) {
    const isAccessCode = /^[A-Za-z]+[-]?\d+$/i.test(email);
    if (isAccessCode) {
      // Lookup email dari Firestore via Server Action
      const lookupEmail = await lookupEmailByAccessCode(email);
      if (lookupEmail) {
        email = lookupEmail;
      } else {
        throw new Error("Access Code tidak ditemukan di dalam sistem.");
      }
    } else {
      // Fallback ke normalisasi NIP
      email = normalizeNipToEmail(nipOrEmail);
    }
  } else {
    email = email.toLowerCase();
  }

  // Login via Firebase Auth — jika gagal, throw error ke UI
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const fbUser: FirebaseUser = userCredential.user;

  // Ambil dokumen profil dari Firestore
  let profile = await getUserProfileFromFirestore(fbUser.uid);

  // Fallback dev mode jika akun Firebase Auth terdaftar tapi dokumen Firestore belum disinkronkan
  if (!profile && process.env.NODE_ENV === "development") {
    profile = getDevUserProfile(fbUser.email || email) || getDevUserProfile(fbUser.uid);
  }

  if (!profile) {
    // Profil belum ada di Firestore — ini tidak boleh terjadi di production.
    // Admin harus membuat profil terlebih dahulu via seed atau manajemen user.
    await signOut(auth);
    throw new Error(
      "Profil Anda belum terdaftar di sistem. " +
      "Hubungi Administrator untuk pendaftaran akun."
    );
  }

  return { user: fbUser, profile };
}

/**
 * Sign out pengguna dari Firebase Auth
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn("[Firebase] Gagal logout:", error);
  }
}
