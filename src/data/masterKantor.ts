import { KantorUnit, GeolocationPoint } from "@/types";
import { SEED_KANTOR } from "./seedData";

/**
 * Daftar Kantor Default Demo: 1 Kantor Resmi Solo Teknopark
 * Kantor lain dapat ditambahkan secara dinamis oleh Administrator via menu Pengaturan.
 */
export const DEFAULT_KANTOR_LIST: KantorUnit[] = [SEED_KANTOR];


/**
 * Hitung jarak Haversine antara dua titik koordinat GPS (dalam meter)
 */
export function calculateHaversineDistance(
  point1: GeolocationPoint,
  point2: GeolocationPoint
): number {
  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

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
  const activeOffices = officeList.filter((o) => o.isActive);
  const targetList = activeOffices.length > 0 ? activeOffices : DEFAULT_KANTOR_LIST;

  const calculated = targetList.map((office) => {
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

  const best = calculated[0];

  return {
    nearestOffice: best.office,
    distanceMeters: best.distanceMeters,
    isWithinRadius: best.isWithinRadius,
    allOfficesWithDistance: calculated,
  };
}
