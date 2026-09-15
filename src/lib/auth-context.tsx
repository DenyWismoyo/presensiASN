"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "./firebase/config";
import {
  DEMO_USERS,
  getUserProfileFromFirestore,
  loginWithNipOrEmail,
  logoutUser,
  upsertUserProfileToFirestore,
} from "./firebase/auth-helpers";
import { UserProfile, UserRole } from "@/types";

export { DEMO_USERS };

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (roleOrNip?: UserRole | string, passwordOrNip?: string) => Promise<void>;
  loginWithCredentials: (nipOrEmail: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  consumeStorage: (bytes: number) => boolean;
  releaseStorage: (bytes: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window === "undefined") return DEMO_USERS.pegawai;
    const savedProfileJson = localStorage.getItem("asn_active_profile");
    if (savedProfileJson) {
      try {
        return JSON.parse(savedProfileJson) as UserProfile;
      } catch {
        // ignore error parsing
      }
    }
    const savedRole = localStorage.getItem("asn_active_role") as UserRole | null;
    if (savedRole && DEMO_USERS[savedRole]) {
      return DEMO_USERS[savedRole];
    }
    return DEMO_USERS.pegawai;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Pasang Firebase Auth state listener jika Firebase terhubung
    try {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          const profile = await getUserProfileFromFirestore(fbUser.uid);
          if (profile) {
            setUser(profile);
            localStorage.setItem("asn_active_role", profile.role);
            localStorage.setItem("asn_active_profile", JSON.stringify(profile));
          }
        }
      });
      return () => unsubscribe();
    } catch (err) {
      console.info("[Auth ASN] Firebase auth listener pasif (mode dev offline):", err);
    }
  }, []);

  const loginWithCredentials = async (
    nipOrEmail: string,
    password: string,
    role: UserRole = "pegawai"
  ) => {
    setIsLoading(true);
    try {
      const profile = await loginWithNipOrEmail(nipOrEmail, password, role);
      setUser(profile);
      localStorage.setItem("asn_active_role", profile.role);
      localStorage.setItem("asn_active_profile", JSON.stringify(profile));
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (roleOrNip: UserRole | string = "pegawai", passwordOrNip?: string) => {
    setIsLoading(true);
    try {
      // Jika dipanggil dengan role (Quick demo login)
      if (roleOrNip === "pegawai" || roleOrNip === "atasan" || roleOrNip === "admin") {
        const selectedUser = { ...DEMO_USERS[roleOrNip] };
        if (passwordOrNip) {
          selectedUser.nip = passwordOrNip;
        }
        setUser(selectedUser);
        localStorage.setItem("asn_active_role", roleOrNip);
        localStorage.setItem("asn_active_profile", JSON.stringify(selectedUser));
      } else {
        // Dipanggil dengan NIP / Email
        await loginWithCredentials(roleOrNip, passwordOrNip || "asn123456");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      setUser(null);
      localStorage.removeItem("asn_active_role");
      localStorage.removeItem("asn_active_profile");
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (role: UserRole) => {
    if (DEMO_USERS[role]) {
      const targetUser = DEMO_USERS[role];
      setUser(targetUser);
      localStorage.setItem("asn_active_role", role);
      localStorage.setItem("asn_active_profile", JSON.stringify(targetUser));
    }
  };

  const consumeStorage = (bytes: number): boolean => {
    if (!user) return false;
    const newUsed = user.storageUsedBytes + bytes;
    if (newUsed > user.storageLimitBytes) {
      return false; // Melebihi kuota 1 GB
    }
    const updatedUser = {
      ...user,
      storageUsedBytes: newUsed,
    };
    setUser(updatedUser);
    localStorage.setItem("asn_active_profile", JSON.stringify(updatedUser));
    upsertUserProfileToFirestore(updatedUser);
    return true;
  };

  const releaseStorage = (bytes: number) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      storageUsedBytes: Math.max(0, user.storageUsedBytes - bytes),
    };
    setUser(updatedUser);
    localStorage.setItem("asn_active_profile", JSON.stringify(updatedUser));
    upsertUserProfileToFirestore(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginWithCredentials,
        logout,
        switchRole,
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
