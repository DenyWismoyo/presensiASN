"use server";

import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/firebase/session";
import { getDevPresensiStore, SEED_FIREBASE_UIDS } from "@/data/seedData";
import {
  PresensiRecord,
  PresensiStatus,
  CheckInPayload,
  CheckOutPayload,
} from "@/types";
import {
  verifyGeofenceServerSide,
  getAuditMetadataFromHeaders,
  checkImpossibleTravel,
} from "@/lib/anti-fraud/server";

// Jam masuk maksimal resmi ASN (07:30 WIB)
const JAM_MASUK_MAKSIMAL = process.env.NEXT_PUBLIC_JAM_MASUK_MAKSIMAL || "07:30";

function generateDocId(userId: string, tanggal: string): string {
  return `${userId}_${tanggal}`;
}

/**
 * Mengambil rekap presensi harian ASN berdasarkan ID pegawai dan tanggal
 */
export async function getPresensiToday(
  userId: string,
  tanggal: string
): Promise<PresensiRecord | null> {
  const docId = generateDocId(userId, tanggal);

  if (isFirebaseAdminConfigured()) {
    try {
      const docRef = adminDb.collection("presensi").doc(docId);
      const snap = await docRef.get();

      if (snap.exists) {
        return snap.data() as PresensiRecord;
      }
    } catch (err) {
      console.warn("[Presensi] Gagal mengambil dari Firestore:", err);
    }
  }

  // Fallback Dev Mode: Ambil dari in-memory dev store
  if (process.env.NODE_ENV === "development") {
    const store = getDevPresensiStore();
    const existing = store.get(docId);
    if (existing) return existing;

    // Cek kemungkinan perbedaan ID (misal UID vs user-asn-001)
    for (const item of store.values()) {
      if (item.tanggal === tanggal && (item.userId === userId || userId === SEED_FIREBASE_UIDS.pegawai)) {
        return item;
      }
    }
  }

  return null;
}

/**
 * Mencatat Check-In ASN (Satelit GPS + Swafoto).
 * Validasi bahwa user yang login adalah user yang melakukan check-in.
 */
export async function recordCheckIn(
  payload: CheckInPayload
): Promise<{ success: boolean; data?: PresensiRecord; message?: string }> {
  // Validasi sesi — hanya user yang login yang bisa check-in untuk dirinya sendiri
  const sessionUser = await requireAuth();
  if (sessionUser.id !== payload.userId) {
    return {
      success: false,
      message: "FORBIDDEN: Anda hanya dapat melakukan check-in untuk akun Anda sendiri.",
    };
  }

  // 1. Tolak tegas jika terdeteksi Fake GPS / Mock Location
  if (payload.isMockDetected) {
    return {
      success: false,
      message:
        "FRAUD_ALERT: Terdeteksi aplikasi Mock Location (Fake GPS) pada perangkat Anda. Presensi dibatalkan demi integritas ASN.",
    };
  }

  const {
    userId, nip, nama, orgId, tanggal,
    kantorId, namaKantor, jarakMeter,
    koordinat, fotoUrl, alamat, catatan,
  } = payload;
  const docId = generateDocId(userId, tanggal);
  const existing = await getPresensiToday(userId, tanggal);
  if (existing?.checkIn) {
    return {
      success: false,
      message: "Anda sudah melakukan Check-In untuk hari ini.",
    };
  }

  // 2. Validasi Geofencing Independen di Server (Zero-Trust Policy)
  const geofence = await verifyGeofenceServerSide(koordinat, kantorId);
  if (!geofence.isValid) {
    return {
      success: false,
      message: geofence.errorMessage || "FRAUD_ALERT: Lokasi presensi Anda berada di luar radius kantor resmi.",
    };
  }

  // 3. Catat Jejak Audit Jaringan & Perangkat
  const { ipAddress, userAgent } = await getAuditMetadataFromHeaders();
  const now = new Date();

  // Evaluasi jam kedatangan vs jam maksimal
  const [maxHour, maxMinute] = JAM_MASUK_MAKSIMAL.split(":").map(Number);
  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();
  const isLate = nowHour > maxHour || (nowHour === maxHour && nowMinute > maxMinute);
  const status: PresensiStatus = isLate ? "terlambat" : "hadir";

  const resolvedKantorNama = geofence.office.namaKantor || namaKantor;

  const newRecord: PresensiRecord = {
    id: docId,
    userId,
    nip,
    nama,
    orgId,
    tanggal,
    kantorId: geofence.office.id,
    namaKantor: resolvedKantorNama,
    status,
    checkIn: {
      waktu: now.toISOString(),
      koordinat,
      fotoUrl,
      isValidLocation: geofence.isValid,
      kantorId: geofence.office.id,
      namaKantor: resolvedKantorNama,
      jarakMeter: jarakMeter ?? geofence.serverDistanceMeters,
      serverVerifiedDistanceMeter: geofence.serverDistanceMeters,
      alamat: alamat || geofence.office.alamat || `Kawasan ${resolvedKantorNama}`,
      catatan,
      ipAddress,
      userAgent,
      gpsAccuracyMeter: payload.gpsAccuracyMeter,
      isMockDetected: false,
    },
  };

  if (isFirebaseAdminConfigured()) {
    try {
      const docRef = adminDb.collection("presensi").doc(docId);
      await docRef.set(newRecord, { merge: true });
    } catch (err) {
      console.warn("[Presensi] Gagal menyimpan ke Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    getDevPresensiStore().set(docId, newRecord);
  }

  return { success: true, data: newRecord };
}

/**
 * Mencatat Check-Out ASN saat jam pulang kerja
 */
export async function recordCheckOut(
  payload: CheckOutPayload
): Promise<{ success: boolean; data?: PresensiRecord; message?: string }> {
  // Validasi sesi
  const sessionUser = await requireAuth();
  if (sessionUser.id !== payload.userId) {
    return {
      success: false,
      message: "FORBIDDEN: Anda hanya dapat melakukan check-out untuk akun Anda sendiri.",
    };
  }

  // 1. Tolak jika terdeteksi Fake GPS
  if (payload.isMockDetected) {
    return {
      success: false,
      message: "FRAUD_ALERT: Terdeteksi manipulasi lokasi GPS tiruan (Mock Location). Check-out dibatalkan.",
    };
  }

  const { userId, tanggal, koordinat, fotoUrl, catatan, jarakMeter, namaKantor, kantorId, alamat } = payload;
  const docId = generateDocId(userId, tanggal);
  const now = new Date();

  // Ambil record yang sudah ada dari Firestore
  const existing = await getPresensiToday(userId, tanggal);
  if (!existing) {
    return {
      success: false,
      message: "Anda belum melakukan Check-In untuk hari ini.",
    };
  }

  if (existing.checkOut) {
    return {
      success: false,
      message: "Anda sudah melakukan Check-Out untuk hari ini.",
    };
  }

  // 2. Validasi Geofencing Independen di Server
  const geofence = await verifyGeofenceServerSide(
    koordinat,
    kantorId || existing.kantorId
  );
  if (!geofence.isValid) {
    return {
      success: false,
      message:
        geofence.errorMessage ||
        "FRAUD_ALERT: Lokasi presensi pulang berada di luar radius kantor resmi.",
    };
  }

  // 3. Deteksi Impossible Travel
  const travelCheck = checkImpossibleTravel(existing.checkIn, koordinat, now);

  // 4. Jejak Audit Jaringan
  const { ipAddress, userAgent } = await getAuditMetadataFromHeaders();

  // Hitung durasi kerja jika checkIn ada
  let durasiKerjaMenit = 0;
  if (existing.checkIn?.waktu) {
    const checkInDate = new Date(existing.checkIn.waktu);
    const diffMs = now.getTime() - checkInDate.getTime();
    durasiKerjaMenit = Math.max(0, Math.round(diffMs / (1000 * 60)));
  }

  const resolvedKantorNama = geofence.office.namaKantor || namaKantor || existing.namaKantor;

  const updatedRecord: PresensiRecord = {
    ...existing,
    durasiKerjaMenit,
    kantorId: geofence.office.id,
    namaKantor: resolvedKantorNama,
    checkOut: {
      waktu: now.toISOString(),
      koordinat,
      fotoUrl,
      isValidLocation: geofence.isValid,
      kantorId: geofence.office.id,
      namaKantor: resolvedKantorNama,
      jarakMeter: jarakMeter ?? geofence.serverDistanceMeters,
      serverVerifiedDistanceMeter: geofence.serverDistanceMeters,
      alamat: alamat || geofence.office.alamat || (resolvedKantorNama ? `Kawasan ${resolvedKantorNama}` : "Lingkungan Kantor Pemerintah"),
      catatan: travelCheck.isSuspicious
        ? `${catatan || ""} [AUDIT: ${travelCheck.note}]`.trim()
        : catatan,
      ipAddress,
      userAgent,
      gpsAccuracyMeter: payload.gpsAccuracyMeter,
      isMockDetected: false,
      isSuspiciousTravel: travelCheck.isSuspicious,
    },
  };

  if (isFirebaseAdminConfigured()) {
    try {
      const docRef = adminDb.collection("presensi").doc(docId);
      await docRef.set(updatedRecord, { merge: true });
    } catch (err) {
      console.warn("[Presensi] Gagal memperbarui Check-Out di Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    getDevPresensiStore().set(docId, updatedRecord);
  }

  return { success: true, data: updatedRecord };
}

/**
 * Mengambil riwayat presensi beberapa hari terakhir
 */
export async function getPresensiHistory(
  userId: string,
  limitDays: number = 7
): Promise<PresensiRecord[]> {
  if (isFirebaseAdminConfigured()) {
    try {
      const snap = await adminDb
        .collection("presensi")
        .where("userId", "==", userId)
        .orderBy("tanggal", "desc")
        .limit(limitDays)
        .get();

      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as PresensiRecord);
      }
    } catch (err) {
      console.warn("[Presensi History] Gagal query Firestore:", err);
    }
  }

  // Fallback Dev Mode: Ambil dari dev store (berisi 30 hari data realistis)
  if (process.env.NODE_ENV === "development") {
    const list = Array.from(getDevPresensiStore().values());
    const filtered = list
      .filter((d) => d.userId === userId || userId === SEED_FIREBASE_UIDS.pegawai)
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    return filtered.slice(0, limitDays);
  }

  return [];
}
