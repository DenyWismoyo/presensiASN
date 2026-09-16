"use server";

import { adminDb } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/firebase/session";
import { PengajuanIzinItem } from "@/types";

/**
 * Mengambil daftar pengajuan izin.
 * Pegawai hanya bisa melihat izin miliknya sendiri.
 * Atasan/admin bisa melihat semua izin.
 */
export async function getIzinList(userId?: string): Promise<PengajuanIzinItem[]> {
  let query = adminDb.collection("izin").orderBy("createdAt", "desc");
  if (userId) {
    query = query.where("userId", "==", userId);
  }
  const snap = await query.get();

  if (!snap.empty) {
    return snap.docs.map((doc) => doc.data() as PengajuanIzinItem);
  }

  return [];
}

/**
 * Mengajukan izin/cuti.
 * User yang login hanya bisa mengajukan izin untuk dirinya sendiri.
 */
export async function submitIzin(
  data: Omit<PengajuanIzinItem, "id" | "createdAt" | "status">
): Promise<{ success: boolean; data?: PengajuanIzinItem; message?: string }> {
  // Validasi sesi
  const sessionUser = await requireAuth();
  if (sessionUser.id !== data.userId) {
    return {
      success: false,
      message: "FORBIDDEN: Anda hanya dapat mengajukan izin untuk akun Anda sendiri.",
    };
  }

  const id = `izin-${Date.now()}`;
  const record: PengajuanIzinItem = {
    ...data,
    id,
    status: "menunggu",
    createdAt: new Date().toISOString(),
  };

  await adminDb.collection("izin").doc(id).set(record);
  return { success: true, data: record, message: "Pengajuan izin berhasil diajukan." };
}
