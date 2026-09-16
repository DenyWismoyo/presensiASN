import { KantorUnit, GeolocationPoint } from "@/types";

export const DEFAULT_KANTOR_LIST: KantorUnit[] = [
  {
    id: "kantor-stp",
    kodeKantor: "STP-01",
    namaKantor: "Solo Teknopark (Pusat Vokasi & Inovasi)",
    kategori: "Kawasan Khusus",
    alamat: "Jl. Ki Hajar Dewantara No.19, Jebres, Surakarta, Jawa Tengah",
    koordinat: {
      lat: -7.558392,
      lng: 110.857528,
    },
    radiusMeter: 200,
    jamMasukMaksimal: "07:30",
    jamPulangMinimal: "16:00",
    orgId: "org-surakarta",
    isActive: true,
  },
  {
    id: "kantor-balaikota",
    kodeKantor: "SETDA-01",
    namaKantor: "Balaikota Surakarta (Gedung Pusat Pemkot)",
    kategori: "Pusat",
    alamat: "Jl. Jend. Sudirman No.2, Kp. Baru, Kec. Pasar Kliwon, Surakarta",
    koordinat: {
      lat: -7.569300,
      lng: 110.829600,
    },
    radiusMeter: 150,
    jamMasukMaksimal: "07:30",
    jamPulangMinimal: "16:00",
    orgId: "org-surakarta",
    isActive: true,
  },
  {
    id: "kantor-bkpsdm",
    kodeKantor: "BKPSDM-01",
    namaKantor: "Kantor BKPSDM Surakarta",
    kategori: "OPD / Dinas",
    alamat: "Kompleks Balaikota, Gedung A Lantai 2, Surakarta",
    koordinat: {
      lat: -7.568500,
      lng: 110.828000,
    },
    radiusMeter: 150,
    jamMasukMaksimal: "07:30",
    jamPulangMinimal: "16:00",
    orgId: "org-surakarta",
    isActive: true,
  },
  {
    id: "kantor-diskominfo",
    kodeKantor: "KOMINFO-01",
    namaKantor: "Dinas Komunikasi & Informatika",
    kategori: "OPD / Dinas",
    alamat: "Jl. Mayor Kusmanto No.1, Loji Gandrung, Surakarta",
    koordinat: {
      lat: -7.566100,
      lng: 110.819200,
    },
    radiusMeter: 150,
    jamMasukMaksimal: "07:30",
    jamPulangMinimal: "16:00",
    orgId: "org-surakarta",
    isActive: true,
  },
  {
    id: "kantor-kec-jebres",
    kodeKantor: "KEC-JEBRES",
    namaKantor: "Kantor Kecamatan Jebres",
    kategori: "Kecamatan",
    alamat: "Jl. Kolonel Sutarto No.120, Jebres, Kec. Jebres, Surakarta",
    koordinat: {
      lat: -7.554000,
      lng: 110.852000,
    },
    radiusMeter: 120,
    jamMasukMaksimal: "07:30",
    jamPulangMinimal: "16:00",
    orgId: "org-surakarta",
    isActive: true,
  },
  {
    id: "kantor-kec-banjarsari",
    kodeKantor: "KEC-BANJARSARI",
    namaKantor: "Kantor Kecamatan Banjarsari",
    kategori: "Kecamatan",
    alamat: "Jl. Adi Sumarmo No.77, Manahan, Kec. Banjarsari, Surakarta",
    koordinat: {
      lat: -7.545000,
      lng: 110.815000,
    },
    radiusMeter: 120,
    jamMasukMaksimal: "07:30",
    jamPulangMinimal: "16:00",
    orgId: "org-surakarta",
    isActive: true,
  },
];

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
