"use server";

import { cookies } from "next/headers";
import { adminAuth, isFirebaseAdminConfigured } from "./admin";
import { getUserProfileFromFirestore } from "./auth-helpers";
import { getDevUserProfile } from "@/data/seedData";
import { UserProfile } from "@/types";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/constants";

/**
 * Menyimpan Firebase ID Token ke httpOnly cookie setelah login sukses.
 * Cookie httpOnly tidak dapat diakses oleh JavaScript client-side.
 */
export async function setSessionCookie(idToken: string): Promise<void> {
  const cookieStore = await cookies();
  
  // Verifikasi token sebelum disimpan (di production wajib valid)
  if (isFirebaseAdminConfigured()) {
    await adminAuth.verifyIdToken(idToken);
  } else if (process.env.NODE_ENV === "development") {
    console.info("[Session DEV] Menyimpan cookie ID token Firebase Auth (mode dev).");
  } else {
    await adminAuth.verifyIdToken(idToken);
  }

  cookieStore.set(SESSION_COOKIE_NAME, idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

/**
 * Menghapus session cookie saat logout
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Mengambil profil user yang sedang aktif dari session cookie.
 * Digunakan di server actions untuk memvalidasi identitas user.
 *
 * @returns UserProfile jika terautentikasi, null jika tidak
 */
export async function getCurrentUserFromSession(): Promise<UserProfile | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    if (isFirebaseAdminConfigured()) {
      const decodedToken = await adminAuth.verifyIdToken(token, true);
      const snap = await import('./admin').then(m => m.adminDb.collection('users').doc(decodedToken.uid).get());
      if (snap.exists) {
        return snap.data() as UserProfile;
      }
      return null;
    }

    // Dev Mode Fallback: Decode payload JWT token Firebase tanpa rahasia Admin SDK
    if (process.env.NODE_ENV === "development") {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], "base64").toString("utf-8");
          const payload = JSON.parse(payloadJson);
          const uid = payload.user_id || payload.sub;
          if (uid) {
            const profile = await getUserProfileFromFirestore(uid);
            if (profile) return profile;
          }
          if (payload.email) {
            const profile = getDevUserProfile(payload.email);
            if (profile) return profile;
          }
        }
      } catch (err) {
        console.warn("[Session DEV] Gagal mem-parse token dev:", err);
      }
    }

    return null;
  } catch (error) {
    console.warn("[Session] Token tidak valid atau expired:", (error as Error).message);
    return null;
  }
}

/**
 * Memastikan user terautentikasi dan memiliki role yang diizinkan.
 * Melempar error jika tidak terautentikasi atau role tidak sesuai.
 *
 * @param allowedRoles - Array role yang diizinkan
 * @returns UserProfile yang valid
 * @throws Error jika tidak terautentikasi atau role tidak sesuai
 */
export async function requireAuth(
  allowedRoles?: string[]
): Promise<UserProfile> {
  const user = await getCurrentUserFromSession();

  if (!user) {
    throw new Error("UNAUTHORIZED: Silakan login terlebih dahulu.");
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error(
      `FORBIDDEN: Akses ditolak. Role '${user.role}' tidak diizinkan untuk aksi ini.`
    );
  }

  return user;
}
