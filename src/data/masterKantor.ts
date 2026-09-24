import { KantorUnit, GeolocationPoint } from "@/types";
import { SEED_KANTOR } from "./seedData";

/**
 * Daftar Kantor Default Demo: 1 Kantor Resmi Kantor Pusat
 * Kantor lain dapat ditambahkan secara dinamis oleh Administrator via menu Pengaturan.
 */
export const DEFAULT_KANTOR_LIST: KantorUnit[] = [SEED_KANTOR];


function getPointLat(p?: any): number | null {
  if (!p) return null;
  const lat =
    typeof p.lat === "number"
      ? p.lat
      : typeof p.latitude === "number"
      ? p.latitude
      : typeof p._latitude === "number"
      ? p._latitude
      : typeof p.lat === "string"
      ? parseFloat(p.lat)
      : typeof p.latitude === "string"
      ? parseFloat(p.latitude)
      : null;
  return lat !== null && !isNaN(lat) ? lat : null;
}

function getPointLng(p?: any): number | null {
  if (!p) return null;
  const lng =
    typeof p.lng === "number"
      ? p.lng
      : typeof p.longitude === "number"
      ? p.longitude
      : typeof p._longitude === "number"
      ? p._longitude
      : typeof p.lng === "string"
      ? parseFloat(p.lng)
      : typeof p.longitude === "string"
      ? parseFloat(p.longitude)
      : null;
  return lng !== null && !isNaN(lng) ? lng : null;
}

/**
 * Hitung jarak Haversine antara dua titik koordinat GPS (dalam meter).
 * Aman terhadap nilai null, undefined, atau format koordinat alternatif.
 */
export function calculateHaversineDistance(
  point1?: GeolocationPoint | null,
  point2?: GeolocationPoint | null
): number {
  const lat1 = getPointLat(point1);
  const lng1 = getPointLng(point1);
  const lat2 = getPointLat(point2);
  const lng2 = getPointLng(point2);

  // Jika salah satu koordinat tidak valid, kembalikan jarak aman tak terhingga
  if (lat1 === null || lng1 === null || lat2 === null || lng2 === null) {
    return 999999;
  }

  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export interface NearestOfficeResult {
  nearestOffice: KantorUnit;
  distanceMeters: number;
  isWithinRadius: boolean;
  allOfficesWithDistance: Array<{
    office: KantorUnit;
    distanceMeters: number;
    isWithinRadius: boolean;
  }>;
}

/**
 * Mendeteksi kantor terdekat secara otomatis dari daftar seluruh kantor aktif
 */
export function detectNearestOffice(
  userCoords: GeolocationPoint,
  officeList: KantorUnit[] = DEFAULT_KANTOR_LIST
): NearestOfficeResult {
  const rawList = Array.isArray(officeList) && officeList.length > 0 ? officeList : DEFAULT_KANTOR_LIST;
  const activeOffices = rawList.filter((o) => o && o.isActive !== false);

  // Normalisasi koordinat setiap kantor agar selalu bertipe { lat: number, lng: number }
  const validOffices = (activeOffices.length > 0 ? activeOffices : DEFAULT_KANTOR_LIST).map(
    (office) => {
      const lat =
        getPointLat(office?.koordinat) ??
        getPointLat(office) ??
        SEED_KANTOR.koordinat.lat;
      const lng =
        getPointLng(office?.koordinat) ??
        getPointLng(office) ??
        SEED_KANTOR.koordinat.lng;

      return {
        ...office,
        koordinat: { lat, lng },
        radiusMeter: typeof office?.radiusMeter === "number" ? office.radiusMeter : 150,
      } as KantorUnit;
    }
  );

  const calculated = validOffices.map((office) => {
    const distanceMeters = calculateHaversineDistance(userCoords, office.koordinat);
    const isWithinRadius = distanceMeters <= office.radiusMeter;
    return {
      office,
      distanceMeters,
      isWithinRadius,
    };
  });

  // Urutkan dari yang terdekat
  calculated.sort((a, b) => a.distanceMeters - b.distanceMeters);

  const best = calculated[0] || {
    office: DEFAULT_KANTOR_LIST[0],
    distanceMeters: 999999,
    isWithinRadius: false,
  };

  return {
    nearestOffice: best.office,
    distanceMeters: best.distanceMeters,
    isWithinRadius: best.isWithinRadius,
    allOfficesWithDistance: calculated,
  };
}
