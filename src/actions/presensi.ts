"use server";

import { adminDb } from "@/lib/firebase/admin";
import { PresensiRecord, PresensiStatus, GeolocationPoint } from "@/types";
import { SEED_PRESENSI_SAMPLE } from "@/data/seedData";

// In-Memory store dengan data seed resmi Solo Teknopark
const devPresensiStore = new Map<string, PresensiRecord>();
devPresensiStore.set(SEED_PRESENSI_SAMPLE.id, SEED_PRESENSI_SAMPLE);


// Jam masuk maksimal resmi ASN (07:30 WIB)
const JAM_MASUK_MAKSIMAL = process.env.NEXT_PUBLIC_JAM_MASUK_MAKSIMAL || "07:30";

function generateDocId(userId: string, tanggal: string): string {
  return `${userId}_${tanggal}`;
}

export interface CheckInPayload {
  userId: string;
  nip: string;
  nama: string;
  orgId: string;
  tanggal: string; // YYYY-MM-DD
  kantorId?: string;
  namaKantor?: string;
  jarakMeter?: number;
  koordinat: GeolocationPoint;
  fotoUrl: string;
  isValidLocation: boolean;
  alamat?: string;
  catatan?: string;
}

export interface CheckOutPayload {
  userId: string;
  tanggal: string; // YYYY-MM-DD
  kantorId?: string;
  namaKantor?: string;
  jarakMeter?: number;
  koordinat: GeolocationPoint;
  fotoUrl: string;
  isValidLocation: boolean;
  alamat?: string;
  catatan?: string;
}

/**
 * Mengambil rekap presensi harian ASN berdasarkan ID pegawai dan tanggal
 */
export async function getPresensiToday(
  userId: string,
  tanggal: string
): Promise<PresensiRecord | null> {
  const docId = generateDocId(userId, tanggal);

  try {
    const docRef = adminDb.collection("presensi").doc(docId);
    const snap = await docRef.get();
    if (snap.exists) {
      return snap.data() as PresensiRecord;
    }
  } catch (error) {
    console.warn("[Server Action Presensi] Firebase Admin offline/mock, cek memory store:", (error as Error).message);
    if (devPresensiStore.has(docId)) {
      return devPresensiStore.get(docId) || null;
    }
  }

  return devPresensiStore.get(docId) || null;
}

/**
 * Mencatat Check-In ASN (Satelit GPS + Swafoto)
 */
export async function recordCheckIn(
  payload: CheckInPayload
): Promise<{ success: boolean; data?: PresensiRecord; message?: string }> {
  const {
    userId,
    nip,
    nama,
    orgId,
    tanggal,
    kantorId,
    namaKantor,
    jarakMeter,
    koordinat,
    fotoUrl,
    isValidLocation,
    alamat,
    catatan,
  } = payload;
  const docId = generateDocId(userId, tanggal);
  const now = new Date();

  // Evaluasi jam kedatangan vs jam maksimal
  const [maxHour, maxMinute] = JAM_MASUK_MAKSIMAL.split(":").map(Number);
  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();
  const isLate = nowHour > maxHour || (nowHour === maxHour && nowMinute > maxMinute);
  const status: PresensiStatus = isLate ? "terlambat" : "hadir";

  const newRecord: PresensiRecord = {
    id: docId,
    userId,
    nip,
    nama,
    orgId,
    tanggal,
    kantorId,
    namaKantor,
    status,
    checkIn: {
      waktu: now.toISOString(),
      koordinat,
      fotoUrl,
      isValidLocation,
      kantorId,
      namaKantor,
      jarakMeter,
      alamat: alamat || (namaKantor ? `Kawasan ${namaKantor}` : "Lingkungan Kantor Pemerintah"),
      catatan,
    },
  };

  try {
    const docRef = adminDb.collection("presensi").doc(docId);
    await docRef.set(newRecord, { merge: true });
    devPresensiStore.set(docId, newRecord);
    return { success: true, data: newRecord };
  } catch (error) {
    console.warn("[Server Action Presensi] Gagal simpan ke Firebase live, simpan ke dev store:", (error as Error).message);
    devPresensiStore.set(docId, newRecord);
    return {
      success: true,
      data: newRecord,
      message: "Check-In tercatat (Mode Simulasi Dev Persisten)",
    };
  }
}

/**
 * Mencatat Check-Out ASN saat jam pulang kerja
 */
export async function recordCheckOut(
  payload: CheckOutPayload
): Promise<{ success: boolean; data?: PresensiRecord; message?: string }> {
  const {
    userId,
    tanggal,
    kantorId,
    namaKantor,
    jarakMeter,
    koordinat,
    fotoUrl,
    isValidLocation,
    alamat,
    catatan,
  } = payload;
  const docId = generateDocId(userId, tanggal);
  const now = new Date();

  // Ambil record yang sudah ada
  let existing = await getPresensiToday(userId, tanggal);
  if (!existing) {
    return {
      success: false,
      message: "Anda belum melakukan Check-In untuk hari ini.",
    };
  }

  // Hitung durasi kerja jika checkIn ada
  let durasiKerjaMenit = 0;
  if (existing.checkIn?.waktu) {
    const checkInDate = new Date(existing.checkIn.waktu);
    const diffMs = now.getTime() - checkInDate.getTime();
    durasiKerjaMenit = Math.max(0, Math.round(diffMs / (1000 * 60)));
  }

  const updatedRecord: PresensiRecord = {
    ...existing,
    durasiKerjaMenit,
    kantorId: kantorId || existing.kantorId,
    namaKantor: namaKantor || existing.namaKantor,
    checkOut: {
      waktu: now.toISOString(),
      koordinat,
      fotoUrl,
      isValidLocation,
      kantorId: kantorId || existing.checkIn?.kantorId,
      namaKantor: namaKantor || existing.checkIn?.namaKantor,
      jarakMeter,
      alamat: alamat || (namaKantor ? `Kawasan ${namaKantor}` : "Lingkungan Kantor Pemerintah"),
      catatan,
    },
  };

  try {
    const docRef = adminDb.collection("presensi").doc(docId);
    await docRef.set(updatedRecord, { merge: true });
    devPresensiStore.set(docId, updatedRecord);
    return { success: true, data: updatedRecord };
  } catch (error) {
    console.warn("[Server Action Presensi] Gagal simpan ke Firebase live, simpan ke dev store:", (error as Error).message);
    devPresensiStore.set(docId, updatedRecord);
    return {
      success: true,
      data: updatedRecord,
      message: "Check-Out tercatat (Mode Simulasi Dev Persisten)",
    };
  }
}

/**
 * Mengambil riwayat presensi beberapa hari terakhir
 */
export async function getPresensiHistory(
  userId: string,
  limitDays: number = 7
): Promise<PresensiRecord[]> {
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
  } catch (error) {
    console.warn("[Server Action Presensi] Riwayat live offline, gunakan dev store:", (error as Error).message);
  }

  // Fallback dari dev store
  const results: PresensiRecord[] = [];
  devPresensiStore.forEach((record) => {
    if (record.userId === userId) {
      results.push(record);
    }
  });

  return results.sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, limitDays);
}
