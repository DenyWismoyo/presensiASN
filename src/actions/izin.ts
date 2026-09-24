"use server";

import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/firebase/session";
import { PengajuanIzinItem } from "@/types";

// In-memory dev store untuk izin
const devIzinStore = new Map<string, PengajuanIzinItem>();

/**
 * Mengambil daftar pengajuan izin.
 * Pegawai hanya bisa melihat izin miliknya sendiri.
 * Atasan/admin bisa melihat semua izin bawahan (berdasarkan orgId).
 */
export async function getIzinList(userId?: string): Promise<PengajuanIzinItem[]> {
  // FIX: requireAuth WAJIB dipanggil sebelum query
  const sessionUser = await requireAuth();

  if (isFirebaseAdminConfigured()) {
    try {
      let query = adminDb.collection("izin").orderBy("createdAt", "desc");
      if (userId) {
        query = query.where("userId", "==", userId);
      } else {
        query = query.where("orgId", "==", sessionUser.orgId);
        if (sessionUser.role === "atasan") {
          query = query.where("atasanId", "==", sessionUser.id);
        }
      }
      const snap = await query.get();

      if (!snap.empty) {
        return snap.docs.map((doc) => doc.data() as PengajuanIzinItem);
      }
      return [];
    } catch (err) {
      console.warn("[Izin] Gagal mengambil dari Firestore:", err);
    }
  }

  // FIX: Dev store fallback
  if (process.env.NODE_ENV === "development") {
    let list = Array.from(devIzinStore.values()).sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt)
    );
    if (userId) {
      return list.filter((item) => item.userId === userId);
    }
    
    list = list.filter((item) => item.orgId === sessionUser.orgId);
    if (sessionUser.role === "atasan") {
      list = list.filter((item) => item.atasanId === sessionUser.id);
    }
    return list;
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

  let finalAtasanId = data.atasanId;
  if (!finalAtasanId) {
    if (!sessionUser.atasanId) {
      return { success: false, message: "Atasan langsung belum ditentukan. Hubungi Admin." };
    }
    finalAtasanId = sessionUser.atasanId;
  }

  const id = `izin-${Date.now()}`;
  const record: PengajuanIzinItem = {
    ...data,
    atasanId: finalAtasanId,
    id,
    status: "menunggu",
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseAdminConfigured()) {
    await adminDb.collection("izin").doc(id).set(record);
  }

  if (process.env.NODE_ENV === "development") {
    devIzinStore.set(id, record);
  }

  return { success: true, data: record, message: "Pengajuan izin berhasil diajukan." };
}

/**
 * Menyetujui pengajuan izin/cuti bawahan.
 * Hanya dapat diakses oleh role atasan atau admin.
 */
export async function approveIzin(
  izinId: string,
  atasanId: string,
  catatanAtasan?: string
): Promise<{ success: boolean; data?: PengajuanIzinItem; message?: string }> {
  const sessionUser = await requireAuth(["atasan", "admin"]);
  if (sessionUser.id !== atasanId && sessionUser.role !== "admin") {
    return { success: false, message: "FORBIDDEN: ID atasan tidak sesuai dengan sesi login." };
  }

  let target: PengajuanIzinItem | null = null;

  if (isFirebaseAdminConfigured()) {
    try {
      const snap = await adminDb.collection("izin").doc(izinId).get();
      if (snap.exists) target = snap.data() as PengajuanIzinItem;
    } catch (err) {
      console.warn("[Izin Approve] Gagal membaca Firestore:", err);
    }
  } else if (process.env.NODE_ENV === "development") {
    target = devIzinStore.get(izinId) || null;
  }

  if (!target) return { success: false, message: "Dokumen izin tidak ditemukan." };

  const updated: PengajuanIzinItem = {
    ...target,
    status: "disetujui",
  };

  if (isFirebaseAdminConfigured()) {
    try {
      await adminDb.collection("izin").doc(izinId).update({ status: "disetujui" });
      
      // Auto-generate presensi records for the approved izin
      const startDate = new Date(target.tanggalMulai);
      const endDate = new Date(target.tanggalSelesai);
      
      let statusPresensi: any = "izin";
      if (target.jenis === "Sakit") statusPresensi = "sakit";
      else if (target.jenis === "Dinas Luar") statusPresensi = "dinas";
      else if (target.jenis === "Cuti Tahunan") statusPresensi = "cuti";

      let current = new Date(startDate);
      while (current <= endDate) {
        const dStr = current.toISOString().split("T")[0];
        const docId = `${target.userId}_${dStr}`;
        const pRecord = {
          id: docId,
          userId: target.userId,
          nip: target.nip,
          nama: target.nama,
          orgId: target.orgId,
          tanggal: dStr,
          status: statusPresensi,
          keterangan: `${target.jenis}: ${target.alasan}`,
          izinId: target.id,
          suratIzinUrl: target.dokumenUrl || null
        };
        await adminDb.collection("presensi").doc(docId).set(pRecord, { merge: true });
        current.setDate(current.getDate() + 1);
      }
    } catch (err) {
      console.warn("[Izin Approve] Gagal update Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    devIzinStore.set(izinId, updated);
  }

  return { success: true, data: updated, message: "Pengajuan izin berhasil disetujui." };
}

/**
 * Menolak pengajuan izin/cuti bawahan.
 * Hanya dapat diakses oleh role atasan atau admin.
 */
export async function rejectIzin(
  izinId: string,
  atasanId: string,
  alasanPenolakan: string
): Promise<{ success: boolean; data?: PengajuanIzinItem; message?: string }> {
  const sessionUser = await requireAuth(["atasan", "admin"]);
  if (sessionUser.id !== atasanId && sessionUser.role !== "admin") {
    return { success: false, message: "FORBIDDEN: ID atasan tidak sesuai dengan sesi login." };
  }

  let target: PengajuanIzinItem | null = null;

  if (isFirebaseAdminConfigured()) {
    try {
      const snap = await adminDb.collection("izin").doc(izinId).get();
      if (snap.exists) target = snap.data() as PengajuanIzinItem;
    } catch (err) {
      console.warn("[Izin Reject] Gagal membaca Firestore:", err);
    }
  } else if (process.env.NODE_ENV === "development") {
    target = devIzinStore.get(izinId) || null;
  }

  if (!target) return { success: false, message: "Dokumen izin tidak ditemukan." };

  const updated: PengajuanIzinItem = {
    ...target,
    status: "ditolak",
  };

  if (isFirebaseAdminConfigured()) {
    try {
      await adminDb.collection("izin").doc(izinId).update({ status: "ditolak" });
    } catch (err) {
      console.warn("[Izin Reject] Gagal update Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    devIzinStore.set(izinId, updated);
  }

  return { success: true, data: updated, message: `Pengajuan izin ditolak: ${alasanPenolakan}` };
}
