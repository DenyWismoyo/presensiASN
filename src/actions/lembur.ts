"use server";

import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/firebase/session";
import {
  LemburRecord,
  LemburStatus,
  PengajuanLemburPayload,
  CheckInLemburPayload,
  CheckOutLemburPayload,
  PresensiRecord,
  PresensiStatus,
} from "@/types";
import {
  verifyGeofenceServerSide,
  getAuditMetadataFromHeaders,
} from "@/lib/anti-fraud/server";

// In-memory dev store untuk lembur
const globalAny = global as any;
const devLemburStore: Map<string, LemburRecord> = globalAny.devLemburStore || new Map<string, LemburRecord>();
if (process.env.NODE_ENV !== "production") {
  globalAny.devLemburStore = devLemburStore;
}

function generateLemburDocId(userId: string, tanggal: string): string {
  return `${userId}_${tanggal}`;
}

/**
 * Mengambil record lembur berdasarkan userId dan tanggal
 */
export async function getLemburByDate(
  userId: string,
  tanggal: string
): Promise<LemburRecord | null> {
  await requireAuth();
  const docId = generateLemburDocId(userId, tanggal);

  if (isFirebaseAdminConfigured()) {
    try {
      const snap = await adminDb.collection("lemburRecords").doc(docId).get();
      if (snap.exists) return snap.data() as LemburRecord;
    } catch (err) {
      console.warn("[Lembur] Gagal mengambil dari Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    const existing = devLemburStore.get(docId);
    if (existing) return existing;
    // Cek juga dengan userId berbeda (seed data)
    for (const item of devLemburStore.values()) {
      if (item.tanggal === tanggal && item.userId === userId) return item;
    }
  }

  return null;
}

/**
 * Mengajukan permintaan lembur ke atasan langsung.
 * Pegawai hanya bisa mengajukan lembur untuk dirinya sendiri.
 */
export async function pengajuanLembur(
  payload: PengajuanLemburPayload
): Promise<{ success: boolean; data?: LemburRecord; message?: string }> {
  const sessionUser = await requireAuth();
  if (sessionUser.id !== payload.userId) {
    return {
      success: false,
      message: "FORBIDDEN: Anda hanya dapat mengajukan lembur untuk akun Anda sendiri.",
    };
  }

  if (!payload.atasanId) {
    return {
      success: false,
      message: "Atasan langsung belum ditetapkan. Hubungi Admin BKPSDM untuk mengatur data kepegawaian Anda.",
    };
  }

  // Validasi: tidak boleh ada pengajuan lembur yang sudah aktif di tanggal yang sama
  const existing = await getLemburByDate(payload.userId, payload.tanggal);
  if (existing && !["ditolak"].includes(existing.status)) {
    return {
      success: false,
      message: `Sudah ada pengajuan lembur untuk tanggal ${payload.tanggal} dengan status: ${existing.status}.`,
    };
  }

  const docId = generateLemburDocId(payload.userId, payload.tanggal);
  const nowIso = new Date().toISOString();

  const record: LemburRecord = {
    id: docId,
    userId: payload.userId,
    nip: payload.nip,
    nama: payload.nama,
    orgId: payload.orgId,
    tanggal: payload.tanggal,
    jenis: payload.jenis,
    alasanLembur: payload.alasanLembur,
    jamMulaiRencana: payload.jamMulaiRencana,
    jamSelesaiRencana: payload.jamSelesaiRencana,
    atasanId: payload.atasanId,
    atasanNama: payload.atasanNama,
    status: "diajukan",
    suratPerintahLemburUrl: payload.suratPerintahLemburUrl,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  if (isFirebaseAdminConfigured()) {
    try {
      await adminDb.collection("lemburRecords").doc(docId).set(record);
    } catch (err) {
      console.warn("[Lembur] Gagal menyimpan ke Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    devLemburStore.set(docId, record);
  }

  return {
    success: true,
    data: record,
    message: `Pengajuan lembur tanggal ${payload.tanggal} berhasil dikirim ke ${payload.atasanNama} untuk disetujui.`,
  };
}

/**
 * Menyetujui pengajuan lembur bawahan.
 * Hanya dapat diakses oleh role atasan atau admin.
 */
export async function approveLembur(
  lemburId: string,
  atasanId: string,
  atasanNama: string,
  catatanAtasan?: string
): Promise<{ success: boolean; data?: LemburRecord; message?: string }> {
  const sessionUser = await requireAuth(["atasan", "admin"]);
  if (sessionUser.id !== atasanId && sessionUser.role !== "admin") {
    return { success: false, message: "FORBIDDEN: ID atasan tidak sesuai dengan sesi login." };
  }

  let target: LemburRecord | null = null;

  if (isFirebaseAdminConfigured()) {
    try {
      const snap = await adminDb.collection("lemburRecords").doc(lemburId).get();
      if (snap.exists) target = snap.data() as LemburRecord;
    } catch (err) {
      console.warn("[Lembur Approve] Gagal membaca Firestore:", err);
    }
  } else if (process.env.NODE_ENV === "development") {
    target = devLemburStore.get(lemburId) || null;
  }

  if (!target) return { success: false, message: "Dokumen lembur tidak ditemukan." };
  if (target.status !== "diajukan") {
    return { success: false, message: `Dokumen lembur sudah berstatus '${target.status}', tidak dapat disetujui.` };
  }

  const nowIso = new Date().toISOString();
  const updated: LemburRecord = {
    ...target,
    status: "disetujui",
    approvedBy: atasanId,
    approvedByName: atasanNama,
    approvedAt: nowIso,
    catatanAtasan: catatanAtasan || "Pengajuan lembur disetujui.",
    updatedAt: nowIso,
  };

  if (isFirebaseAdminConfigured()) {
    try {
      await adminDb.collection("lemburRecords").doc(lemburId).set(updated, { merge: true });
    } catch (err) {
      console.warn("[Lembur Approve] Gagal update Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    devLemburStore.set(lemburId, updated);
  }

  return { success: true, data: updated, message: "Pengajuan lembur berhasil disetujui." };
}

/**
 * Menolak pengajuan lembur bawahan.
 * Hanya dapat diakses oleh role atasan atau admin.
 */
export async function rejectLembur(
  lemburId: string,
  atasanId: string,
  atasanNama: string,
  alasanPenolakan: string
): Promise<{ success: boolean; data?: LemburRecord; message?: string }> {
  const sessionUser = await requireAuth(["atasan", "admin"]);
  if (sessionUser.id !== atasanId && sessionUser.role !== "admin") {
    return { success: false, message: "FORBIDDEN: ID atasan tidak sesuai dengan sesi login." };
  }

  let target: LemburRecord | null = null;

  if (isFirebaseAdminConfigured()) {
    try {
      const snap = await adminDb.collection("lemburRecords").doc(lemburId).get();
      if (snap.exists) target = snap.data() as LemburRecord;
    } catch (err) {
      console.warn("[Lembur Reject] Gagal membaca Firestore:", err);
    }
  } else if (process.env.NODE_ENV === "development") {
    target = devLemburStore.get(lemburId) || null;
  }

  if (!target) return { success: false, message: "Dokumen lembur tidak ditemukan." };

  const nowIso = new Date().toISOString();
  const updated: LemburRecord = {
    ...target,
    status: "ditolak",
    approvedBy: atasanId,
    approvedByName: atasanNama,
    rejectedReason: alasanPenolakan,
    catatanAtasan: `Ditolak: ${alasanPenolakan}`,
    updatedAt: nowIso,
  };

  if (isFirebaseAdminConfigured()) {
    try {
      await adminDb.collection("lemburRecords").doc(lemburId).set(updated, { merge: true });
    } catch (err) {
      console.warn("[Lembur Reject] Gagal update Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    devLemburStore.set(lemburId, updated);
  }

  return { success: true, data: updated, message: `Pengajuan lembur ditolak: ${alasanPenolakan}` };
}

/**
 * Check-In Lembur: Pegawai melakukan presensi masuk lembur.
 * Hanya bisa dilakukan jika lembur sudah disetujui atasan.
 * Menggunakan geofence validation (harus berada di area kantor).
 */
export async function checkInLembur(
  payload: CheckInLemburPayload
): Promise<{ success: boolean; data?: LemburRecord; message?: string }> {
  const sessionUser = await requireAuth();
  if (sessionUser.id !== payload.userId) {
    return {
      success: false,
      message: "FORBIDDEN: Anda hanya dapat melakukan check-in lembur untuk akun Anda sendiri.",
    };
  }

  if (payload.isMockDetected) {
    return {
      success: false,
      message: "FRAUD_ALERT: Terdeteksi aplikasi Mock Location (Fake GPS). Presensi lembur dibatalkan.",
    };
  }

  const existing = await getLemburByDate(payload.userId, payload.tanggal);
  if (!existing) {
    return { success: false, message: "Tidak ada pengajuan lembur untuk tanggal ini." };
  }
  if (existing.status !== "disetujui") {
    return {
      success: false,
      message: `Lembur belum disetujui atasan (status: ${existing.status}). Check-in tidak dapat dilakukan.`,
    };
  }
  if (existing.checkInLembur) {
    return { success: false, message: "Anda sudah melakukan Check-In Lembur untuk hari ini." };
  }

  // Validasi geofence server-side (Zero-Trust)
  const geofence = await verifyGeofenceServerSide(payload.koordinat, payload.kantorId);
  if (!geofence.isValid) {
    return {
      success: false,
      message: geofence.errorMessage || "FRAUD_ALERT: Lokasi lembur Anda berada di luar radius kantor resmi.",
    };
  }

  const { ipAddress, userAgent } = await getAuditMetadataFromHeaders();
  const now = new Date();

  const updated: LemburRecord = {
    ...existing,
    checkInLembur: {
      waktu: now.toISOString(),
      koordinat: payload.koordinat,
      fotoUrl: payload.fotoUrl,
      isValidLocation: geofence.isValid,
      kantorId: geofence.office.id,
      namaKantor: geofence.office.namaKantor,
      jarakMeter: payload.jarakMeter ?? geofence.serverDistanceMeters,
      serverVerifiedDistanceMeter: geofence.serverDistanceMeters,
      alamat: payload.alamat || geofence.office.alamat || `Kawasan ${geofence.office.namaKantor}`,
      ipAddress,
      userAgent,
      gpsAccuracyMeter: payload.gpsAccuracyMeter,
      isMockDetected: false,
    },
    updatedAt: now.toISOString(),
  };

  const docId = generateLemburDocId(payload.userId, payload.tanggal);

  if (isFirebaseAdminConfigured()) {
    try {
      await adminDb.collection("lemburRecords").doc(docId).set(updated, { merge: true });
      
      // Sinkronisasi ke Presensi (jika lembur di hari libur)
      if (existing.jenis !== "hari_kerja") {
        const presensiDocId = `${payload.userId}_${payload.tanggal}`;
        const pRecord = {
          id: presensiDocId,
          userId: payload.userId,
          nip: existing.nip,
          nama: existing.nama,
          orgId: existing.orgId,
          tanggal: payload.tanggal,
          status: "lembur" as PresensiStatus,
          lemburRecordId: docId,
          checkIn: updated.checkInLembur,
        };
        await adminDb.collection("presensi").doc(presensiDocId).set(pRecord, { merge: true });
      }
    } catch (err) {
      console.warn("[Lembur CheckIn] Gagal menyimpan ke Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    devLemburStore.set(docId, updated);
  }

  return { success: true, data: updated };
}

/**
 * Check-Out Lembur: Pegawai melakukan presensi pulang lembur.
 * Menghitung durasi lembur aktual dan memperbarui status menjadi 'selesai'.
 */
export async function checkOutLembur(
  payload: CheckOutLemburPayload
): Promise<{ success: boolean; data?: LemburRecord; message?: string }> {
  const sessionUser = await requireAuth();
  if (sessionUser.id !== payload.userId) {
    return {
      success: false,
      message: "FORBIDDEN: Anda hanya dapat melakukan check-out lembur untuk akun Anda sendiri.",
    };
  }

  if (payload.isMockDetected) {
    return {
      success: false,
      message: "FRAUD_ALERT: Terdeteksi manipulasi lokasi GPS tiruan. Check-out lembur dibatalkan.",
    };
  }

  const existing = await getLemburByDate(payload.userId, payload.tanggal);
  if (!existing || !existing.checkInLembur) {
    return { success: false, message: "Anda belum melakukan Check-In Lembur untuk hari ini." };
  }
  if (existing.checkOutLembur) {
    return { success: false, message: "Anda sudah melakukan Check-Out Lembur untuk hari ini." };
  }

  // Validasi geofence server-side
  const geofence = await verifyGeofenceServerSide(
    payload.koordinat,
    payload.kantorId || existing.checkInLembur.kantorId
  );
  if (!geofence.isValid) {
    return {
      success: false,
      message: geofence.errorMessage || "FRAUD_ALERT: Lokasi check-out lembur berada di luar radius kantor.",
    };
  }

  const { ipAddress, userAgent } = await getAuditMetadataFromHeaders();
  const now = new Date();

  // Hitung durasi lembur aktual
  let durasiLemburMenit = 0;
  if (existing.checkInLembur?.waktu) {
    const checkInDate = new Date(existing.checkInLembur.waktu);
    const diffMs = now.getTime() - checkInDate.getTime();
    durasiLemburMenit = Math.max(0, Math.round(diffMs / (1000 * 60)));
  }

  const updated: LemburRecord = {
    ...existing,
    status: "selesai",
    durasiLemburMenit,
    checkOutLembur: {
      waktu: now.toISOString(),
      koordinat: payload.koordinat,
      fotoUrl: payload.fotoUrl,
      isValidLocation: geofence.isValid,
      kantorId: geofence.office.id,
      namaKantor: geofence.office.namaKantor,
      jarakMeter: payload.jarakMeter ?? geofence.serverDistanceMeters,
      serverVerifiedDistanceMeter: geofence.serverDistanceMeters,
      alamat: payload.alamat || geofence.office.alamat || `Kawasan ${geofence.office.namaKantor}`,
      ipAddress,
      userAgent,
      gpsAccuracyMeter: payload.gpsAccuracyMeter,
      isMockDetected: false,
    },
    updatedAt: now.toISOString(),
  };

  const docId = generateLemburDocId(payload.userId, payload.tanggal);

  if (isFirebaseAdminConfigured()) {
    try {
      await adminDb.collection("lemburRecords").doc(docId).set(updated, { merge: true });
      
      // Sinkronisasi ke Presensi
      if (existing.jenis !== "hari_kerja") {
        const presensiDocId = `${payload.userId}_${payload.tanggal}`;
        const pRecord = {
          checkOut: updated.checkOutLembur,
          durasiKerjaMenit: durasiLemburMenit,
        };
        await adminDb.collection("presensi").doc(presensiDocId).set(pRecord, { merge: true });
      }
    } catch (err) {
      console.warn("[Lembur CheckOut] Gagal update Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    devLemburStore.set(docId, updated);
  }

  return { success: true, data: updated };
}

/**
 * Mengambil daftar pengajuan lembur yang menunggu persetujuan.
 * Atasan hanya melihat lembur bawahan langsungnya.
 */
export async function getPendingLemburList(
  orgId?: string
): Promise<LemburRecord[]> {
  const sessionUser = await requireAuth(["atasan", "admin"]);

  if (isFirebaseAdminConfigured()) {
    try {
      let query = adminDb
        .collection("lemburRecords")
        .where("status", "==", "diajukan")
        .where("orgId", "==", sessionUser.orgId);

      const snap = await query.get();

      if (!snap.empty) {
        let list = snap.docs.map((doc) => doc.data() as LemburRecord);
        // Filter: atasan hanya melihat bawahan langsungnya
        if (sessionUser.role === "atasan") {
          list = list.filter((item) => item.atasanId === sessionUser.id);
        }
        return list.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
      }
    } catch (err) {
      console.warn("[Lembur Pending] Gagal query Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    let list = Array.from(devLemburStore.values()).filter(
      (item) =>
        item.status === "diajukan" && item.orgId === sessionUser.orgId
    );
    if (sessionUser.role === "atasan") {
      list = list.filter((item) => item.atasanId === sessionUser.id);
    }
    return list.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }

  return [];
}

/**
 * Mengambil riwayat lembur pegawai.
 */
export async function getLemburHistory(
  userId: string,
  limitDays: number = 30
): Promise<LemburRecord[]> {
  const sessionUser = await requireAuth();

  if (isFirebaseAdminConfigured()) {
    try {
      const snap = await adminDb
        .collection("lemburRecords")
        .where("userId", "==", userId)
        .where("orgId", "==", sessionUser.orgId)
        .orderBy("tanggal", "desc")
        .limit(limitDays)
        .get();

      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as LemburRecord);
      }
    } catch (err) {
      console.warn("[Lembur History] Gagal query Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    const list = Array.from(devLemburStore.values())
      .filter((d) => d.userId === userId && d.orgId === sessionUser.orgId)
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    return list.slice(0, limitDays);
  }

  return [];
}
