"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, User as FirebaseUser, getIdToken } from "firebase/auth";
import { auth } from "./firebase/config";
import {
  getUserProfileFromFirestore,
  loginWithNipOrEmail,
  logoutUser,
  upsertUserProfileToFirestore,
} from "./firebase/auth-helpers";
import { UserProfile } from "@/types";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/constants";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  loginWithCredentials: (nipOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  consumeStorage: (bytes: number) => boolean;
  releaseStorage: (bytes: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Simpan Firebase ID Token ke cookie agar bisa dibaca middleware.
 * Cookie diset via document.cookie (tanpa httpOnly untuk client-set).
 * httpOnly cookie diset via server action di session.ts.
 */
async function persistTokenToCookie(fbUser: FirebaseUser): Promise<void> {
  try {
    const idToken = await getIdToken(fbUser, false);
    const maxAge = SESSION_MAX_AGE_SECONDS;
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${SESSION_COOKIE_NAME}=${idToken}; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
  } catch (err) {
    console.warn("[Auth] Gagal menyimpan token ke cookie:", err);
  }
}

/**
 * Hapus session cookie saat logout
 */
function clearTokenCookie(): void {
  document.cookie = `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // State awal null — user belum terautentikasi
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true saat inisialisasi

  useEffect(() => {
    // Dengarkan perubahan Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        // User sudah login di Firebase — ambil profil dari Firestore
        const profile = await getUserProfileFromFirestore(fbUser.uid);
        if (profile) {
          setUser(profile);
          // Refresh token dan simpan ke cookie untuk middleware
          await persistTokenToCookie(fbUser);
        } else {
          // Profil tidak ditemukan — logout paksa
          await logoutUser();
          clearTokenCookie();
          setUser(null);
        }
      } else {
        // Tidak ada sesi Firebase yang aktif
        clearTokenCookie();
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithCredentials = useCallback(async (
    nipOrEmail: string,
    password: string,
  ) => {
    setIsLoading(true);
    try {
      const { user: fbUser, profile } = await loginWithNipOrEmail(nipOrEmail, password);
      setUser(profile);
      await persistTokenToCookie(fbUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      clearTokenCookie();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const consumeStorage = useCallback((bytes: number): boolean => {
    if (!user) return false;
    const newUsed = user.storageUsedBytes + bytes;
    if (newUsed > user.storageLimitBytes) {
      return false;
    }
    const updatedUser = { ...user, storageUsedBytes: newUsed };
    setUser(updatedUser);
    upsertUserProfileToFirestore(updatedUser);
    return true;
  }, [user]);

  const releaseStorage = useCallback((bytes: number) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      storageUsedBytes: Math.max(0, user.storageUsedBytes - bytes),
    };
    setUser(updatedUser);
    upsertUserProfileToFirestore(updatedUser);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginWithCredentials,
        logout,
        consumeStorage,
        releaseStorage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return context;
}
