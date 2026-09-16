import { headers } from "next/headers";
import { adminDb } from "@/lib/firebase/admin";
import { KantorUnit, GeolocationPoint, PresensiCheckPoint } from "@/types";
import { DEFAULT_KANTOR_LIST, calculateHaversineDistance } from "@/data/masterKantor";

export interface ServerGeofenceResult {
  isValid: boolean;
  office: KantorUnit;
  serverDistanceMeters: number;
  maxRadiusMeters: number;
  errorMessage?: string;
}

export interface AuditHeaderMetadata {
  ipAddress: string;
  userAgent: string;
}

/**
 * Mengekstrak informasi jejak audit jaringan dan perangkat dari request headers.
 */
export async function getAuditMetadataFromHeaders(): Promise<AuditHeaderMetadata> {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : headersList.get("x-real-ip") || "127.0.0.1";

    const userAgent = headersList.get("user-agent") || "Unknown Device / Browser";

    return { ipAddress, userAgent };
  } catch {
    return { ipAddress: "127.0.0.1", userAgent: "Internal Server Action" };
  }
}

/**
 * Memvalidasi lokasi dan radius kantor secara independen di sisi server (Zero-Trust Policy).
 * Server tidak mempercayai jarak atau status lokasi yang dikirim oleh browser klien.
 */
export async function verifyGeofenceServerSide(
  userCoords: GeolocationPoint,
  kantorId?: string
): Promise<ServerGeofenceResult> {
  let targetKantor: KantorUnit | null = null;

  // 1. Ambil data kantor resmi dari Firestore
  if (kantorId) {
    try {
      const snap = await adminDb.collection("kantor").doc(kantorId).get();
      if (snap.exists) {
        targetKantor = snap.data() as KantorUnit;
      }
    } catch (err) {
      console.warn("[AntiFraud Server] Gagal mengambil kantor dari Firestore:", err);
    }
  }

  // 2. Fallback ke daftar kantor bawaan jika belum ada di Firestore
  if (!targetKantor) {
    targetKantor =
      DEFAULT_KANTOR_LIST.find((k) => k.id === kantorId) || DEFAULT_KANTOR_LIST[0];
  }

  // 3. Hitung ulang jarak Haversine di server
  const serverDistanceMeters = calculateHaversineDistance(
    userCoords,
    targetKantor.koordinat
  );

  const isValid = serverDistanceMeters <= targetKantor.radiusMeter;

  if (!isValid) {
    return {
      isValid: false,
      office: targetKantor,
      serverDistanceMeters,
      maxRadiusMeters: targetKantor.radiusMeter,
      errorMessage: `FRAUD_ALERT: Lokasi presensi Anda tidak sah. Server mendeteksi posisi Anda berada ${serverDistanceMeters} meter dari ${targetKantor.namaKantor} (Batas radius resmi: ${targetKantor.radiusMeter} meter). Presensi ditolak.`,
    };
  }

  return {
    isValid: true,
    office: targetKantor,
    serverDistanceMeters,
    maxRadiusMeters: targetKantor.radiusMeter,
  };
}

/**
 * Memeriksa anomali perpindahan lokasi yang mustahil (Impossible Travel / Teleportation).
 * Misalnya: Check-in di Kantor A, lalu 10 menit kemudian checkout di Kantor B yang berjarak 50 km (kecepatan > 150 km/jam).
 */
export function checkImpossibleTravel(
  lastPoint: PresensiCheckPoint | undefined,
  currentCoords: GeolocationPoint,
  currentTime: Date
): { isSuspicious: boolean; speedKmH?: number; note?: string } {
  if (!lastPoint || !lastPoint.waktu || !lastPoint.koordinat) {
    return { isSuspicious: false };
  }

  const lastTime = new Date(lastPoint.waktu);
  const diffHours = (currentTime.getTime() - lastTime.getTime()) / (1000 * 60 * 60);

  // Hanya periksa jika perpindahan terjadi dalam kurun waktu kurang dari 3 jam
  if (diffHours <= 0 || diffHours > 3) {
    return { isSuspicious: false };
  }

  const distanceMeters = calculateHaversineDistance(lastPoint.koordinat, currentCoords);
  const distanceKm = distanceMeters / 1000;
  const speedKmH = Math.round(distanceKm / diffHours);

  // Jika kecepatan berpindah melebihi 140 km/jam di area perkotaan Surakarta
  if (speedKmH > 140 && distanceKm > 10) {
    return {
      isSuspicious: true,
      speedKmH,
      note: `Anomali perpindahan lokasi: kecepatan gerak terdeteksi ${speedKmH} km/jam (${distanceKm.toFixed(1)} km dalam ${(diffHours * 60).toFixed(0)} menit).`,
    };
  }

  return { isSuspicious: false, speedKmH };
}
