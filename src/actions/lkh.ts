"use server";

import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/firebase/session";
import { getDevLKHStore, SEED_FIREBASE_UIDS } from "@/data/seedData";
import { LKHRecord, LKHItem, LKHStatus } from "@/types";
import { TARGET_POIN_HARIAN } from "@/data/masterAktivitas";

function generateLkhDocId(userId: string, tanggal: string): string {
  return `${userId}_${tanggal}`;
}

export interface SaveLKHPayload {
  userId: string;
  nip: string;
  nama: string;
  orgId: string;
  tanggal: string; // YYYY-MM-DD
  kegiatan: LKHItem[];
  catatanPegawai?: string;
  status?: LKHStatus;
}

/**
 * Mengambil lembar kerja harian (LKH) ASN berdasarkan ID pegawai dan tanggal
 */
export async function getLKHByDate(
  userId: string,
  tanggal: string
): Promise<LKHRecord | null> {
  const docId = generateLkhDocId(userId, tanggal);

  if (isFirebaseAdminConfigured()) {
    try {
      const docRef = adminDb.collection("lkh").doc(docId);
      const snap = await docRef.get();

      if (snap.exists) {
        return snap.data() as LKHRecord;
      }
    } catch (err) {
      console.warn("[LKH] Gagal mengambil dari Firestore:", err);
    }
  }

  // Fallback Dev Mode: Ambil dari dev store
  if (process.env.NODE_ENV === "development") {
    const store = getDevLKHStore();
    const existing = store.get(docId);
    if (existing) return existing;

    for (const item of store.values()) {
      if (item.tanggal === tanggal && (item.userId === userId || userId === SEED_FIREBASE_UIDS.pegawai)) {
        return item;
      }
    }
  }

  return null;
}

/**
 * Menyimpan draf LKH ASN (kegiatan, perhitungan total poin SKP)
 */
export async function saveLKH(
  payload: SaveLKHPayload
): Promise<{ success: boolean; data?: LKHRecord; message?: string }> {
  // Validasi sesi
  const sessionUser = await requireAuth();
  if (sessionUser.id !== payload.userId) {
    return {
      success: false,
      message: "FORBIDDEN: Anda hanya dapat menyimpan LKH untuk akun Anda sendiri.",
    };
  }

  const { userId, nip, nama, orgId, tanggal, kegiatan, catatanPegawai, status = "draft" } = payload;
  const docId = generateLkhDocId(userId, tanggal);
  const nowIso = new Date().toISOString();

  // Hitung total poin
  const totalPoinHarian = kegiatan.reduce(
    (acc, curr) => acc + (curr.totalPoin || (curr.volumeKegiatan * (curr.nilaiPoin || 0))),
    0
  );
  const isTargetTercapai = totalPoinHarian >= TARGET_POIN_HARIAN;

  // Ambil data existing untuk mempertahankan catatan atasan dll
  let existing: LKHRecord | null = null;
  if (isFirebaseAdminConfigured()) {
    try {
      const existingSnap = await adminDb.collection("lkh").doc(docId).get();
      existing = existingSnap.exists ? (existingSnap.data() as LKHRecord) : null;
    } catch (err) {
      console.warn("[LKH] Gagal membaca existing dari Firestore:", err);
    }
  } else if (process.env.NODE_ENV === "development") {
    existing = getDevLKHStore().get(docId) || null;
  }

  const record: LKHRecord = {
    id: docId,
    userId,
    nip,
    nama,
    orgId,
    tanggal,
    kegiatan,
    totalPoinHarian,
    targetPoinHarian: TARGET_POIN_HARIAN,
    isTargetTercapai,
    status,
    catatanPegawai: catatanPegawai || existing?.catatanPegawai,
    catatanAtasan: existing?.catatanAtasan,
    approvedBy: existing?.approvedBy,
    approvedByName: existing?.approvedByName,
    approvedAt: existing?.approvedAt,
    rejectedReason: existing?.rejectedReason,
    createdAt: existing?.createdAt || nowIso,
    updatedAt: nowIso,
  };

  if (isFirebaseAdminConfigured()) {
    try {
      const docRef = adminDb.collection("lkh").doc(docId);
      await docRef.set(record, { merge: true });
    } catch (err) {
      console.warn("[LKH] Gagal menyimpan ke Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    getDevLKHStore().set(docId, record);
  }

  return { success: true, data: record };
}

/**
 * Mengajukan/Submit LKH ke Atasan Langsung untuk diverifikasi
 */
export async function submitLKH(
  userId: string,
  tanggal: string
): Promise<{ success: boolean; data?: LKHRecord; message?: string }> {
  // Validasi sesi
  const sessionUser = await requireAuth();
  if (sessionUser.id !== userId && sessionUser.nip !== userId) {
    return { success: false, message: "FORBIDDEN: Anda hanya dapat mengajukan LKH Anda sendiri." };
  }

  const docId = generateLkhDocId(userId, tanggal);
  const existing = await getLKHByDate(userId, tanggal);

  if (!existing || existing.kegiatan.length === 0) {
    return {
      success: false,
      message: "Tidak dapat mengirim LKH kosong. Harap tambahkan minimal 1 kegiatan.",
    };
  }

  const updatedAt = new Date().toISOString();
  const updatedData: LKHRecord = { ...existing, status: "submitted", updatedAt };

  if (isFirebaseAdminConfigured()) {
    try {
      const docRef = adminDb.collection("lkh").doc(docId);
      await docRef.update({ status: "submitted", updatedAt });
    } catch (err) {
      console.warn("[LKH] Gagal update status submit di Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    getDevLKHStore().set(docId, updatedData);
  }

  return {
    success: true,
    data: updatedData,
  };
}

/**
 * Mengambil daftar seluruh LKH yang menunggu persetujuan atasan.
 * Hanya dapat diakses oleh role atasan/admin.
 */
export async function getPendingLKHList(
  orgId?: string
): Promise<LKHRecord[]> {
  // Validasi sesi — hanya atasan/admin
  await requireAuth(["atasan", "admin"]);

  if (isFirebaseAdminConfigured()) {
    try {
      let query = adminDb.collection("lkh").where("status", "==", "submitted");
      if (orgId) {
        query = query.where("orgId", "==", orgId);
      }
      const snap = await query.get();

      if (!snap.empty) {
        return snap.docs.map((doc) => doc.data() as LKHRecord);
      }
    } catch (err) {
      console.warn("[LKH Pending] Gagal query Firestore:", err);
    }
  }

  // Fallback Dev Mode: Ambil dari dev store yang statusnya submitted
  if (process.env.NODE_ENV === "development") {
    const list = Array.from(getDevLKHStore().values());
    return list.filter((item) => item.status === "submitted" && (!orgId || item.orgId === orgId));
  }

  return [];
}

/**
 * Menyetujui LKH bawahan oleh Atasan Langsung.
 * Hanya dapat diakses oleh role atasan/admin.
 */
export async function approveLKH(
  lkhId: string,
  atasanId: string,
  atasanNama: string,
  catatanAtasan?: string
): Promise<{ success: boolean; data?: LKHRecord; message?: string }> {
  // Validasi sesi — hanya atasan/admin
  const sessionUser = await requireAuth(["atasan", "admin"]);
  if (sessionUser.id !== atasanId && sessionUser.role !== "admin") {
    return { success: false, message: "FORBIDDEN: ID atasan tidak sesuai dengan sesi login." };
  }

  let target: LKHRecord | null = null;

  if (isFirebaseAdminConfigured()) {
    try {
      const snap = await adminDb.collection("lkh").doc(lkhId).get();
      if (snap.exists) {
        target = snap.data() as LKHRecord;
      }
    } catch (err) {
      console.warn("[LKH Approve] Gagal membaca dokumen Firestore:", err);
    }
  }

  if (!target && process.env.NODE_ENV === "development") {
    target = getDevLKHStore().get(lkhId) || null;
  }

  if (!target) {
    return { success: false, message: "Dokumen LKH tidak ditemukan." };
  }

  const nowIso = new Date().toISOString();

  const updated: LKHRecord = {
    ...target,
    status: "approved",
    approvedBy: atasanId,
    approvedByName: atasanNama,
    approvedAt: nowIso,
    catatanAtasan: catatanAtasan || "LKH disetujui sesuai target kinerja.",
    updatedAt: nowIso,
  };

  if (isFirebaseAdminConfigured()) {
    try {
      await adminDb.collection("lkh").doc(lkhId).set(updated, { merge: true });
    } catch (err) {
      console.warn("[LKH Approve] Gagal update status di Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    getDevLKHStore().set(lkhId, updated);
  }

  return { success: true, data: updated };
}

/**
 * Menolak/Mengembalikan LKH bawahan untuk perbaikan.
 * Hanya dapat diakses oleh role atasan/admin.
 */
export async function rejectLKH(
  lkhId: string,
  atasanId: string,
  atasanNama: string,
  rejectedReason: string
): Promise<{ success: boolean; data?: LKHRecord; message?: string }> {
  // Validasi sesi — hanya atasan/admin
  const sessionUser = await requireAuth(["atasan", "admin"]);
  if (sessionUser.id !== atasanId && sessionUser.role !== "admin") {
    return { success: false, message: "FORBIDDEN: ID atasan tidak sesuai dengan sesi login." };
  }

  let target: LKHRecord | null = null;

  if (isFirebaseAdminConfigured()) {
    try {
      const snap = await adminDb.collection("lkh").doc(lkhId).get();
      if (snap.exists) {
        target = snap.data() as LKHRecord;
      }
    } catch (err) {
      console.warn("[LKH Reject] Gagal membaca dokumen Firestore:", err);
    }
  }

  if (!target && process.env.NODE_ENV === "development") {
    target = getDevLKHStore().get(lkhId) || null;
  }

  if (!target) {
    return { success: false, message: "Dokumen LKH tidak ditemukan." };
  }

  const nowIso = new Date().toISOString();

  const updated: LKHRecord = {
    ...target,
    status: "rejected",
    approvedBy: atasanId,
    approvedByName: atasanNama,
    rejectedReason,
    catatanAtasan: `Dikembalikan: ${rejectedReason}`,
    updatedAt: nowIso,
  };

  if (isFirebaseAdminConfigured()) {
    try {
      await adminDb.collection("lkh").doc(lkhId).set(updated, { merge: true });
    } catch (err) {
      console.warn("[LKH Reject] Gagal update status di Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    getDevLKHStore().set(lkhId, updated);
  }

  return { success: true, data: updated };
}
