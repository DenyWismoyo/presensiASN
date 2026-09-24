"use server";

import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/firebase/session";
import { OrganizationConfig } from "@/types";

// Dev store untuk fallback jika firestore tidak terhubung
const globalAny = global as any;
const devOrgStore: Map<string, OrganizationConfig> = globalAny.devOrgStore || new Map<string, OrganizationConfig>([
  [
    "org-surakarta",
    {
      id: "org-surakarta",
      name: "Pemerintah Kota Surakarta",
      defaultJamMasukMaksimal: "07:30",
      defaultJamPulangMinimal: "16:00",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
]);
if (process.env.NODE_ENV !== "production") {
  globalAny.devOrgStore = devOrgStore;
}

/**
 * Mengambil konfigurasi organisasi berdasarkan orgId
 */
export async function getOrganizationConfig(orgId: string): Promise<OrganizationConfig | null> {
  if (isFirebaseAdminConfigured()) {
    try {
      const snap = await adminDb.collection("organizations").doc(orgId).get();
      if (snap.exists) {
        return snap.data() as OrganizationConfig;
      }
    } catch (err) {
      console.warn("[Organization] Gagal query Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    return devOrgStore.get(orgId) || null;
  }

  return null;
}

/**
 * Mengambil semua organisasi (hanya admin/superadmin yang bisa memanggil ini jika diperlukan)
 */
export async function getAllOrganizations(): Promise<OrganizationConfig[]> {
  await requireAuth(["admin"]);

  if (isFirebaseAdminConfigured()) {
    try {
      const snap = await adminDb.collection("organizations").get();
      if (!snap.empty) {
        return snap.docs.map(doc => doc.data() as OrganizationConfig);
      }
    } catch (err) {
      console.warn("[Organization] Gagal mengambil daftar organisasi Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    return Array.from(devOrgStore.values());
  }

  return [];
}

/**
 * Menyimpan konfigurasi organisasi
 */
export async function saveOrganizationConfig(
  payload: OrganizationConfig
): Promise<{ success: boolean; data?: OrganizationConfig; message?: string }> {
  // Validasi: hanya admin
  await requireAuth(["admin"]);

  const now = new Date().toISOString();
  const org: OrganizationConfig = {
    ...payload,
    updatedAt: now,
  };
  
  if (!org.createdAt) {
    org.createdAt = now;
  }

  if (isFirebaseAdminConfigured()) {
    try {
      await adminDb.collection("organizations").doc(org.id).set(org, { merge: true });
    } catch (err) {
      console.warn("[Organization] Gagal menyimpan ke Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    devOrgStore.set(org.id, org);
  }

  return { success: true, data: org, message: "Konfigurasi organisasi berhasil disimpan." };
}
