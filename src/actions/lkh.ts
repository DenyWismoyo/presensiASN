"use server";

import { adminDb } from "@/lib/firebase/admin";
import { LKHRecord, LKHItem, LKHStatus } from "@/types";
import { TARGET_POIN_HARIAN } from "@/data/masterAktivitas";
import { SEED_LKH_SAMPLE } from "@/data/seedData";

// Fallback in-memory store dengan data seed resmi Solo Teknopark
const devLkhStore = new Map<string, LKHRecord>();
devLkhStore.set(SEED_LKH_SAMPLE.id, SEED_LKH_SAMPLE);


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

  try {
    const docRef = adminDb.collection("lkh").doc(docId);
    const snap = await docRef.get();
    if (snap.exists) {
      return snap.data() as LKHRecord;
    }
  } catch (error) {
    console.warn("[Server Action LKH] Firebase Admin offline/mock, cek memory store:", (error as Error).message);
    if (devLkhStore.has(docId)) {
      return devLkhStore.get(docId) || null;
    }
  }

  return devLkhStore.get(docId) || null;
}

/**
 * Menyimpan draf LKH ASN (kegiatan, perhitungan total poin SKP)
 */
export async function saveLKH(
  payload: SaveLKHPayload
): Promise<{ success: boolean; data?: LKHRecord; message?: string }> {
  const { userId, nip, nama, orgId, tanggal, kegiatan, catatanPegawai, status = "draft" } = payload;
  const docId = generateLkhDocId(userId, tanggal);
  const nowIso = new Date().toISOString();

  // Hitung total poin
  const totalPoinHarian = kegiatan.reduce(
    (acc, curr) => acc + (curr.totalPoin || (curr.volumeKegiatan * (curr.nilaiPoin || 0))),
    0
  );
  const isTargetTercapai = totalPoinHarian >= TARGET_POIN_HARIAN;

  const existing = devLkhStore.get(docId);

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

  try {
    const docRef = adminDb.collection("lkh").doc(docId);
    await docRef.set(record, { merge: true });
    devLkhStore.set(docId, record);
    return { success: true, data: record };
  } catch (error) {
    console.warn("[Server Action LKH] Gagal simpan ke Firebase live, simpan ke dev store:", (error as Error).message);
    devLkhStore.set(docId, record);
    return {
      success: true,
      data: record,
      message: "Draf LKH tersimpan (Mode Simulasi Dev Persisten)",
    };
  }
}

/**
 * Mengajukan/Submit LKH ke Atasan Langsung untuk diverifikasi
 */
export async function submitLKH(
  userId: string,
  tanggal: string
): Promise<{ success: boolean; data?: LKHRecord; message?: string }> {
  const docId = generateLkhDocId(userId, tanggal);
  const existing = await getLKHByDate(userId, tanggal);

  if (!existing || existing.kegiatan.length === 0) {
    return {
      success: false,
      message: "Tidak dapat mengirim LKH kosong. Harap tambahkan minimal 1 kegiatan.",
    };
  }

  const updatedRecord: LKHRecord = {
    ...existing,
    status: "submitted",
    updatedAt: new Date().toISOString(),
  };

  try {
    const docRef = adminDb.collection("lkh").doc(docId);
    await docRef.update({
      status: "submitted",
      updatedAt: updatedRecord.updatedAt,
    });
    devLkhStore.set(docId, updatedRecord);
    return { success: true, data: updatedRecord };
  } catch (error) {
    console.warn("[Server Action LKH] Submit live offline, update dev store:", (error as Error).message);
    devLkhStore.set(docId, updatedRecord);
    return {
      success: true,
      data: updatedRecord,
      message: "LKH berhasil diajukan ke atasan (Mode Simulasi Dev Persisten)",
    };
  }
}

/**
 * Mengambil daftar seluruh LKH yang menunggu persetujuan atasan
 */
export async function getPendingLKHList(
  orgId?: string
): Promise<LKHRecord[]> {
  try {
    let query = adminDb.collection("lkh").where("status", "==", "submitted");
    if (orgId) {
      query = query.where("orgId", "==", orgId);
    }
    const snap = await query.get();
    if (!snap.empty) {
      return snap.docs.map((doc) => doc.data() as LKHRecord);
    }
  } catch (error) {
    console.warn("[Server Action LKH] Ambil pending live offline, gunakan dev store:", (error as Error).message);
  }

  // Fallback dari dev store
  const results: LKHRecord[] = [];
  devLkhStore.forEach((record) => {
    if (record.status === "submitted") {
      if (!orgId || record.orgId === orgId) {
        results.push(record);
      }
    }
  });

  // Jika dev store masih kosong, gunakan SEED_LKH_SAMPLE resmi Solo Teknopark
  if (results.length === 0) {
    devLkhStore.set(SEED_LKH_SAMPLE.id, SEED_LKH_SAMPLE);
    results.push(SEED_LKH_SAMPLE);
  }

  return results;

}

/**
 * Menyetujui LKH bawahan oleh Atasan Langsung
 */
export async function approveLKH(
  lkhId: string,
  atasanId: string,
  atasanNama: string,
  catatanAtasan?: string
): Promise<{ success: boolean; data?: LKHRecord; message?: string }> {
  const nowIso = new Date().toISOString();

  let target = devLkhStore.get(lkhId);
  if (!target) {
    try {
      const snap = await adminDb.collection("lkh").doc(lkhId).get();
      if (snap.exists) {
        target = snap.data() as LKHRecord;
      }
    } catch {
      // ignore
    }
  }

  if (!target) {
    return { success: false, message: "Dokumen LKH tidak ditemukan." };
  }

  const updated: LKHRecord = {
    ...target,
    status: "approved",
    approvedBy: atasanId,
    approvedByName: atasanNama,
    approvedAt: nowIso,
    catatanAtasan: catatanAtasan || "LKH disetujui sesuai target kinerja.",
    updatedAt: nowIso,
  };

  try {
    await adminDb.collection("lkh").doc(lkhId).set(updated, { merge: true });
    devLkhStore.set(lkhId, updated);
    return { success: true, data: updated };
  } catch (error) {
    console.warn("[Server Action LKH] Approve live offline, update dev store:", (error as Error).message);
    devLkhStore.set(lkhId, updated);
    return { success: true, data: updated, message: "LKH disetujui (Mode Dev)" };
  }
}

/**
 * Menolak/Mengembalikan LKH bawahan untuk perbaikan
 */
export async function rejectLKH(
  lkhId: string,
  atasanId: string,
  atasanNama: string,
  rejectedReason: string
): Promise<{ success: boolean; data?: LKHRecord; message?: string }> {
  const nowIso = new Date().toISOString();

  let target = devLkhStore.get(lkhId);
  if (!target) {
    try {
      const snap = await adminDb.collection("lkh").doc(lkhId).get();
      if (snap.exists) {
        target = snap.data() as LKHRecord;
      }
    } catch {
      // ignore
    }
  }

  if (!target) {
    return { success: false, message: "Dokumen LKH tidak ditemukan." };
  }

  const updated: LKHRecord = {
    ...target,
    status: "rejected",
    approvedBy: atasanId,
    approvedByName: atasanNama,
    rejectedReason,
    catatanAtasan: `Dikembalikan: ${rejectedReason}`,
    updatedAt: nowIso,
  };

  try {
    await adminDb.collection("lkh").doc(lkhId).set(updated, { merge: true });
    devLkhStore.set(lkhId, updated);
    return { success: true, data: updated };
  } catch (error) {
    console.warn("[Server Action LKH] Reject live offline, update dev store:", (error as Error).message);
    devLkhStore.set(lkhId, updated);
    return { success: true, data: updated, message: "LKH dikembalikan (Mode Dev)" };
  }
}
