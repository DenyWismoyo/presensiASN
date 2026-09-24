"use server";

import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/firebase/session";
import { getDevPresensiStore, SEED_FIREBASE_UIDS } from "@/data/seedData";
import {
  PresensiRecord,
  PresensiStatus,
  CheckInPayload,
  CheckOutPayload,
  PengajuanIzinItem,
  LemburRecord,
} from "@/types";
import { getIzinList } from "@/actions/izin";
import { getLemburByDate } from "@/actions/lembur";
import {
  verifyGeofenceServerSide,
  getAuditMetadataFromHeaders,
  checkImpossibleTravel,
} from "@/lib/anti-fraud/server";
import { CheckInSchema, CheckOutSchema } from "@/lib/validations";
import { recordAuditLog } from "@/actions/audit";

// Default fallback jika tidak ada di env atau konfigurasi kantor
const DEFAULT_JAM_MASUK = process.env.NEXT_PUBLIC_JAM_MASUK_MAKSIMAL || "07:30";

function generateDocId(userId: string, tanggal: string, shiftId?: string): string {
  return shiftId ? `${userId}_${tanggal}_${shiftId}` : `${userId}_${tanggal}`;
}

/**
 * Mengambil rekap presensi harian ASN berdasarkan ID pegawai dan tanggal
 */
export async function getPresensiToday(
  userId: string,
  tanggal: string,
  shiftId?: string
): Promise<PresensiRecord | null> {
  await requireAuth();
  const docId = generateDocId(userId, tanggal, shiftId);

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
 * Mengambil status kehadiran gabungan hari ini (Presensi, Izin, Lembur)
 */
export async function getKehadiranStatusHariIni(
  userId: string,
  tanggal: string
): Promise<{
  presensi: PresensiRecord | null;
  izinAktif: PengajuanIzinItem | null;
  lemburAktif: LemburRecord | null;
  isHariLibur: boolean;
  statusKehadiran: PresensiStatus | 'belum_absen';
}> {
  await requireAuth();
  const presensi = await getPresensiToday(userId, tanggal);
  const lemburAktif = await getLemburByDate(userId, tanggal);
  
  const izinList = await getIzinList(userId);
  const izinAktif = izinList.find(izin => 
    izin.status === "disetujui" && 
    tanggal >= izin.tanggalMulai && 
    tanggal <= izin.tanggalSelesai
  ) || null;

  // Cek hari libur (sementara false, akan diintegrasikan dengan modul kalender libur)
  const isHariLibur = false;
  
  let statusKehadiran: PresensiStatus | 'belum_absen' = 'belum_absen';
  
  if (izinAktif) {
    if (izinAktif.jenis === 'Sakit') statusKehadiran = 'sakit';
    else if (izinAktif.jenis === 'Dinas Luar') statusKehadiran = 'dinas';
    else if (izinAktif.jenis === 'Cuti Tahunan') statusKehadiran = 'cuti';
    else statusKehadiran = 'izin';
  } else if (presensi?.checkIn) {
    statusKehadiran = 'hadir';
  } else if (isHariLibur) {
    statusKehadiran = 'libur';
  } else if (lemburAktif?.status === 'disetujui' && lemburAktif.jenis !== 'hari_kerja') {
    statusKehadiran = 'lembur';
  }

  return {
    presensi,
    izinAktif,
    lemburAktif,
    isHariLibur,
    statusKehadiran
  };
}

/**
 * Mencatat Check-In ASN (Satelit GPS + Swafoto).
 * Validasi bahwa user yang login adalah user yang melakukan check-in.
 */
export async function recordCheckIn(
  payload: CheckInPayload
): Promise<{ success: boolean; data?: PresensiRecord; message?: string }> {
  // Validasi Zod
  const validationResult = CheckInSchema.safeParse(payload);
  if (!validationResult.success) {
    return {
      success: false,
      message: "Validasi data gagal: " + validationResult.error.issues.map(e => e.message).join(", "),
    };
  }

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
    userId, nip, nama, orgId, tanggal, shiftId,
    kantorId, namaKantor, jarakMeter,
    koordinat, fotoUrl, alamat, catatan,
  } = payload;
  const docId = generateDocId(userId, tanggal, shiftId);
  const existing = await getPresensiToday(userId, tanggal, shiftId);
  if (existing?.checkIn) {
    return {
      success: false,
      message: "Anda sudah melakukan Check-In untuk hari ini.",
    };
  }

  // Cross-Check Izin Aktif (Rule 7)
  const izinList = await getIzinList(userId);
  const activeIzin = izinList.find(izin => 
    izin.status === "disetujui" && 
    tanggal >= izin.tanggalMulai && 
    tanggal <= izin.tanggalSelesai
  );

  if (activeIzin) {
    return {
      success: false,
      message: `Anda sedang dalam masa ${activeIzin.jenis} yang disetujui (hingga ${activeIzin.tanggalSelesai}). Check-In dibatalkan.`,
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
  const maxTime = geofence.office?.jamMasukMaksimal || DEFAULT_JAM_MASUK;
  const [maxHour, maxMinute] = maxTime.split(":").map(Number);
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
    shiftId,
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

  // Rekam Audit Log
  await recordAuditLog({
    action: "CREATE",
    entityType: "PRESENSI",
    entityId: docId,
    details: `Check-In presensi ${status} di ${resolvedKantorNama}`,
    ipAddress,
    userAgent
  });

  return { success: true, data: newRecord };
}

/**
 * Mencatat Check-Out ASN saat jam pulang kerja
 */
export async function recordCheckOut(
  payload: CheckOutPayload
): Promise<{ success: boolean; data?: PresensiRecord; message?: string }> {
  // Validasi Zod
  const validationResult = CheckOutSchema.safeParse(payload);
  if (!validationResult.success) {
    return {
      success: false,
      message: "Validasi data gagal: " + validationResult.error.issues.map(e => e.message).join(", "),
    };
  }

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

  const { userId, tanggal, shiftId, koordinat, fotoUrl, catatan, jarakMeter, namaKantor, kantorId, alamat } = payload;
  const docId = generateDocId(userId, tanggal, shiftId);
  const now = new Date();

  // Ambil record yang sudah ada dari Firestore
  const existing = await getPresensiToday(userId, tanggal, shiftId);
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

  // Aturan Anti-Fraud: DILARANG REUSE FOTO (Rule 1)
  if (existing.checkIn?.fotoUrl && fotoUrl === existing.checkIn.fotoUrl) {
    return {
      success: false,
      message: "FRAUD_ALERT: DILARANG REUSE FOTO. Foto Check-Out harus menggunakan jepretan kamera yang baru, tidak boleh menggunakan foto Check-In.",
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

  // 3. Validasi Jam Pulang Minimal
  const minTime = geofence.office?.jamPulangMinimal || "16:00";
  const [minHour, minMinute] = minTime.split(":").map(Number);
  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();
  if (nowHour < minHour || (nowHour === minHour && nowMinute < minMinute)) {
    return {
      success: false,
      message: `Belum waktunya pulang. Jam pulang minimal untuk ${geofence.office?.namaKantor || 'kantor Anda'} adalah ${minTime} WIB.`,
    };
  }

  // 4. Deteksi Impossible Travel
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

  // Rekam Audit Log
  await recordAuditLog({
    action: "UPDATE",
    entityType: "PRESENSI",
    entityId: docId,
    details: `Check-Out presensi durasi ${durasiKerjaMenit} menit`,
    ipAddress,
    userAgent
  });

  return { success: true, data: updatedRecord };
}

/**
 * Mengambil riwayat presensi beberapa hari terakhir
 */
export async function getPresensiHistory(
  userId: string,
  limitDays: number = 7
): Promise<PresensiRecord[]> {
  const sessionUser = await requireAuth();

  if (isFirebaseAdminConfigured()) {
    try {
      const snap = await adminDb
        .collection("presensi")
        .where("userId", "==", userId)
        .where("orgId", "==", sessionUser.orgId)
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
      .filter((d) => (d.userId === userId || userId === SEED_FIREBASE_UIDS.pegawai) && d.orgId === sessionUser.orgId)
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    return filtered.slice(0, limitDays);
  }

  return [];
}
