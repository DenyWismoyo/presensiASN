"use server";

import { adminAuth, adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/firebase/session";
import { UserProfile, UserRole } from "@/types";
import { DEFAULT_STORAGE_LIMIT_BYTES } from "@/lib/utils";
import { getDevUsersStore, addDevUser, deleteDevUser } from "@/data/seedData";

export interface CreatePegawaiPayload {
  nip: string;
  nama: string;
  email: string;
  password?: string;
  role: UserRole;
  jabatan: string;
  golongan: string;
  instansi?: string;
  orgId?: string;
  departmentId?: string;
  departmentName?: string;
  kantorId: string;
  namaKantor: string;
  atasanId?: string;
  atasanNama?: string;
  nomorHp?: string;
}

export interface PegawaiFilter {
  kantorId?: string;
  role?: UserRole;
  search?: string;
  departmentName?: string;
}

/**
 * Mengambil daftar seluruh ASN terdaftar.
 * Akses: Admin & Atasan (Pejabat Penilai).
 */
export async function getPegawaiList(
  filters?: PegawaiFilter
): Promise<UserProfile[]> {
  const sessionUser = await requireAuth(["admin", "atasan"]);

  let list: UserProfile[] = [];

  if (isFirebaseAdminConfigured()) {
    try {
      const snap = await adminDb.collection("users").where("orgId", "==", sessionUser.orgId).get();
      if (!snap.empty) {
        list = snap.docs.map((doc) => doc.data() as UserProfile);
      }
    } catch (err) {
      console.warn("[Pegawai Action] Gagal mengambil dari Firestore:", err);
    }
  }

  // Mode Development Fallback: Gunakan dev store
  if (list.length === 0 && process.env.NODE_ENV === "development") {
    list = Array.from(getDevUsersStore().values()).filter(u => u.orgId === sessionUser.orgId);
  }

  // Terapkan filter di memori
  if (filters) {
    const { kantorId, role, search, departmentName } = filters;
    if (kantorId && kantorId !== "all") {
      list = list.filter((u) => u.kantorId === kantorId);
    }
    if (departmentName && departmentName !== "all") {
      list = list.filter((u) => u.departmentName === departmentName);
    }
    if (role && role !== ("all" as unknown as UserRole)) {
      list = list.filter((u) => u.role === role);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.nama.toLowerCase().includes(q) ||
          u.nip.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
          u.email.toLowerCase().includes(q) ||
          u.jabatan.toLowerCase().includes(q)
      );
    }
  }

  // Urutkan berdasarkan Role (Admin -> Atasan -> Pegawai) lalu Nama
  const roleWeight: Record<UserRole, number> = { admin: 1, atasan: 2, pegawai: 3 };
  return list.sort((a, b) => {
    const weightA = roleWeight[a.role] || 99;
    const weightB = roleWeight[b.role] || 99;
    if (weightA !== weightB) return weightA - weightB;
    return a.nama.localeCompare(b.nama);
  });
}

/**
 * Mendaftarkan akun ASN baru (Dual-Provisioning: Firebase Auth + Firestore).
 * Akses: HANYA Role Admin (BKPSDM).
 */
export async function createPegawaiAction(
  payload: CreatePegawaiPayload
): Promise<{ success: boolean; data?: UserProfile; message: string }> {
  const sessionUser = await requireAuth(["admin"]);

  // 1. Validasi Input Kedinasan
  const cleanNip = payload.nip.replace(/\D/g, "");
  if (cleanNip.length < 9) {
    return {
      success: false,
      message: "Format NIP tidak valid. NIP harus berupa angka resmi ASN.",
    };
  }

  if (!payload.nama || payload.nama.trim().length < 3) {
    return {
      success: false,
      message: "Nama lengkap pegawai wajib diisi minimal 3 karakter beserta gelar kedinasan.",
    };
  }

  const emailLower = payload.email.trim().toLowerCase();
  if (!emailLower.includes("@")) {
    return {
      success: false,
      message: "Alamat email kedinasan tidak valid.",
    };
  }

  const passwordAwal = payload.password?.trim() || "asn123456";
  if (passwordAwal.length < 6) {
    return {
      success: false,
      message: "Kata sandi awal minimal 6 karakter.",
    };
  }

  const nowIso = new Date().toISOString();
  let generatedUid = `asn_${cleanNip}_${Date.now().toString().slice(-4)}`;

  // 2. Lapisan Autentikasi Firebase Auth
  if (isFirebaseAdminConfigured()) {
    try {
      const userRecord = await adminAuth.createUser({
        email: emailLower,
        password: passwordAwal,
        displayName: payload.nama.trim(),
      });
      generatedUid = userRecord.uid;
    } catch (authErr) {
      const err = authErr as Error;
      if (err.message.includes("email-already-exists")) {
        return {
          success: false,
          message: `Email '${emailLower}' sudah terdaftar di sistem. Gunakan email kedinasan lain.`,
        };
      }
      return {
        success: false,
        message: `Gagal membuat akun autentikasi: ${err.message}`,
      };
    }
  }

  // 3. Lapisan Dokumen Profil Firestore
  const newProfile: UserProfile = {
    id: generatedUid,
    nip: payload.nip.trim(),
    nama: payload.nama.trim(),
    email: emailLower,
    role: payload.role,
    jabatan: payload.jabatan.trim(),
    golongan: payload.golongan.trim(),
    instansi: payload.instansi || "Perusahaan XYZ - Kantor Pusat",
    orgId: sessionUser.orgId, // Wajib gunakan orgId dari admin yang sedang login
    departmentId: payload.departmentId || "dept-umum-stp",
    departmentName: payload.departmentName || "Subdivisi Rekayasa Perangkat Lunak & AI",
    kantorId: payload.kantorId,
    namaKantor: payload.namaKantor,
    atasanId: payload.atasanId,
    atasanNama: payload.atasanNama,
    nomorHp: payload.nomorHp?.trim() || "",
    storageUsedBytes: 0,
    storageLimitBytes: DEFAULT_STORAGE_LIMIT_BYTES,
    createdAt: nowIso,
  };

  if (isFirebaseAdminConfigured()) {
    try {
      await adminDb.collection("users").doc(generatedUid).set(newProfile, { merge: true });
    } catch (dbErr) {
      console.error("[Pegawai DB Error]:", dbErr);
    }
  }

  // Mode Development: Sinkronkan ke dev store lokal
  if (process.env.NODE_ENV === "development") {
    addDevUser(newProfile);
  }

  return {
    success: true,
    data: newProfile,
    message: `Akun ASN ${newProfile.nama} (${newProfile.nip}) berhasil didaftarkan dengan kata sandi awal: ${passwordAwal}`,
  };
}

/**
 * Memperbarui profil ASN.
 * Akses: HANYA Role Admin (BKPSDM).
 * FIX: Selalu sync atasanNama saat atasanId diubah untuk menghindari inkonsistensi data.
 */
export async function updatePegawaiAction(
  userId: string,
  payload: Partial<UserProfile>
): Promise<{ success: boolean; data?: UserProfile; message: string }> {
  await requireAuth(["admin"]);

  let finalPayload = { ...payload };

  // Sync atasanNama: jika atasanId disediakan tapi atasanNama tidak, resolve dari Firestore/dev store
  if (finalPayload.atasanId && !finalPayload.atasanNama) {
    if (isFirebaseAdminConfigured()) {
      try {
        const atasanSnap = await adminDb.collection("users").doc(finalPayload.atasanId).get();
        if (atasanSnap.exists) {
          finalPayload.atasanNama = (atasanSnap.data() as UserProfile).nama;
        }
      } catch (err) {
        console.warn("[Pegawai Update] Gagal resolve atasanNama:", err);
      }
    } else if (process.env.NODE_ENV === "development") {
      const store = getDevUsersStore();
      const atasan = store.get(finalPayload.atasanId);
      if (atasan) finalPayload.atasanNama = atasan.nama;
    }
  }

  // Jika atasanId dikosongkan, hapus atasanNama juga
  if (finalPayload.atasanId === "" || finalPayload.atasanId === null) {
    finalPayload.atasanNama = "";
  }

  if (isFirebaseAdminConfigured()) {
    try {
      await adminDb.collection("users").doc(userId).set(finalPayload, { merge: true });
    } catch (err) {
      console.warn("[Pegawai Update] Gagal update Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    const store = getDevUsersStore();
    const existing = store.get(userId);
    if (existing) {
      const merged = { ...existing, ...finalPayload };
      store.set(userId, merged);
      return { success: true, data: merged, message: "Data profil ASN berhasil diperbarui." };
    }
  }

  return { success: true, message: "Data profil ASN berhasil diperbarui." };
}

/**
 * Menonaktifkan atau menghapus akun ASN.
 * Akses: HANYA Role Admin (BKPSDM).
 */
export async function deletePegawaiAction(
  userId: string
): Promise<{ success: boolean; message: string }> {
  await requireAuth(["admin"]);

  if (isFirebaseAdminConfigured()) {
    try {
      await adminAuth.deleteUser(userId);
      await adminDb.collection("users").doc(userId).delete();
    } catch (err) {
      console.warn("[Pegawai Delete] Gagal menghapus dari Firebase:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    deleteDevUser(userId);
  }

  return { success: true, message: "Akun ASN berhasil dinonaktifkan dari sistem." };
}
