import { KantorUnit, UserProfile, UserRole, PresensiRecord, LKHRecord } from "@/types";
import { DEFAULT_STORAGE_LIMIT_BYTES } from "@/lib/utils";

/**
 * 1 Kantor Percontohan Resmi: Solo Teknopark Surakarta
 */
export const SEED_KANTOR: KantorUnit = {
  id: "kantor-stp",
  kodeKantor: "STP-01",
  namaKantor: "Solo Teknopark (Pusat Vokasi & Inovasi)",
  kategori: "Kawasan Khusus",
  alamat: "Jl. Ki Hajar Dewantara No.19, Jebres, Kota Surakarta, Jawa Tengah 57126",
  koordinat: {
    lat: -7.558392,
    lng: 110.857528,
  },
  radiusMeter: 200,
  jamMasukMaksimal: "07:30",
  jamPulangMinimal: "16:00",
  orgId: "org-surakarta",
  isActive: true,
};

/**
 * 3 Akun ASN Demo Terpadu pada Kantor Solo Teknopark
 * Saling berelasi:
 * - Admin mengelola kepegawaian kantor
 * - Atasan (Kepala Divisi) menjadi penilai kinerja
 * - Pegawai (Pranata Komputer) melapor kepada Atasan
 */
export const SEED_FIREBASE_UIDS = {
  pegawai: "DrwAiaKokNhjjlbaQjnuuJ8Al4m1",
  atasan: "Uvo5KeY3pOcvdOYInpBcTJCDAb53",
  admin: "Ze6odkY0boPjgC5jfWVPph3jfPF3",
};

/**
 * 3 Akun ASN Demo Terpadu pada Kantor Solo Teknopark
 * ID diselaraskan langsung dengan UID Firebase Auth yang telah terdaftar resmi
 */
export const SEED_USERS: Record<UserRole, UserProfile> = {
  admin: {
    id: SEED_FIREBASE_UIDS.admin,
    nip: "19850101 201001 1 005",
    nama: "Hendra Wijaya, S.STP, M.AP",
    email: "admin.stp@surakarta.go.id",
    role: "admin",
    jabatan: "Administrator Kepegawaian Utama",
    golongan: "III/d - Penata Tingkat I",
    instansi: "Pemerintah Kota Surakarta - Solo Teknopark",
    departmentId: "dept-adm-stp",
    departmentName: "Sekretariat & Tata Usaha Solo Teknopark",
    kantorId: "kantor-stp",
    namaKantor: "Solo Teknopark",
    orgId: "org-surakarta",
    nomorHp: "081377889900",
    storageUsedBytes: 52428800, // ~50 MB
    storageLimitBytes: DEFAULT_STORAGE_LIMIT_BYTES,
  },
  atasan: {
    id: SEED_FIREBASE_UIDS.atasan,
    nip: "19780412 200502 2 001",
    nama: "Dra. Siti Rahmawati, M.Si.",
    email: "siti.rahmawati@surakarta.go.id",
    role: "atasan",
    jabatan: "Kepala Divisi Inovasi & Teknologi",
    golongan: "IV/b - Pembina Tingkat I",
    instansi: "Pemerintah Kota Surakarta - Solo Teknopark",
    departmentId: "dept-inovasi-stp",
    departmentName: "Divisi Inovasi & Alih Teknologi Solo Teknopark",
    kantorId: "kantor-stp",
    namaKantor: "Solo Teknopark",
    orgId: "org-surakarta",
    nomorHp: "081298765432",
    storageUsedBytes: 125829120, // ~120 MB
    storageLimitBytes: DEFAULT_STORAGE_LIMIT_BYTES,
  },
  pegawai: {
    id: SEED_FIREBASE_UIDS.pegawai,
    nip: "19920817 201801 1 002",
    nama: "Budi Santoso, S.Kom.",
    email: "budi.santoso@surakarta.go.id",
    role: "pegawai",
    jabatan: "Pranata Komputer Ahli Pertama",
    golongan: "III/a - Penata Muda",
    instansi: "Pemerintah Kota Surakarta - Solo Teknopark",
    departmentId: "dept-inovasi-stp",
    departmentName: "Subdivisi Rekayasa Perangkat Lunak & AI",
    atasanId: SEED_FIREBASE_UIDS.atasan,
    atasanNama: "Dra. Siti Rahmawati, M.Si.",
    kantorId: "kantor-stp",
    namaKantor: "Solo Teknopark",
    orgId: "org-surakarta",
    nomorHp: "081234567890",
    storageUsedBytes: 83886080, // ~80 MB
    storageLimitBytes: DEFAULT_STORAGE_LIMIT_BYTES,
  },
};

/**
 * Akun Bawahan ke-2 untuk simulasi approval tim pada akun Atasan
 */
export const SEED_PEGAWAI_2: UserProfile = {
  id: "user-asn-003",
  nip: "19950415 202001 2 006",
  nama: "Rina Wulandari, S.Kom.",
  email: "rina.wulandari@surakarta.go.id",
  role: "pegawai",
  jabatan: "Pranata Komputer Pelaksana",
  golongan: "II/c - Pengatur",
  instansi: "Pemerintah Kota Surakarta - Solo Teknopark",
  departmentId: "dept-inovasi-stp",
  departmentName: "Subdivisi Rekayasa Perangkat Lunak & AI",
  atasanId: SEED_FIREBASE_UIDS.atasan,
  atasanNama: "Dra. Siti Rahmawati, M.Si.",
  kantorId: "kantor-stp",
  namaKantor: "Solo Teknopark",
  orgId: "org-surakarta",
  nomorHp: "081322334455",
  storageUsedBytes: 31457280,
  storageLimitBytes: DEFAULT_STORAGE_LIMIT_BYTES,
};

/**
 * Helper mencari profil dev berdasarkan identifier (UID Firebase, email, atau NIP)
 */
export function getDevUserProfile(identifier: string): UserProfile | null {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase();
  const digitsOnly = identifier.replace(/\D/g, "");

  // Ambil dari dynamic dev users store (termasuk user yang baru didaftarkan)
  const pool = Array.from(getDevUsersStore().values());

  for (const user of pool) {
    if (
      user.id.toLowerCase() === clean ||
      user.email.toLowerCase() === clean ||
      user.nip.replace(/\D/g, "") === digitsOnly ||
      (clean.startsWith("user-asn-001") && user.role === "pegawai") ||
      (clean.startsWith("user-asn-002") && user.role === "atasan") ||
      (clean.startsWith("user-asn-000") && user.role === "admin")
    ) {
      return user;
    }
  }

  return null;
}

/**
 * Rekap Presensi Hari Ini (Sudah Check-In Hadir di Solo Teknopark)
 */
const todayStr = new Date().toISOString().split("T")[0];

export const SEED_PRESENSI_SAMPLE: PresensiRecord = {
  id: `${SEED_FIREBASE_UIDS.pegawai}_${todayStr}`,
  userId: SEED_FIREBASE_UIDS.pegawai,
  nip: "19920817 201801 1 002",
  nama: "Budi Santoso, S.Kom.",
  orgId: "org-surakarta",
  tanggal: todayStr,
  kantorId: "kantor-stp",
  namaKantor: "Solo Teknopark (Pusat Vokasi & Inovasi)",
  status: "hadir",
  checkIn: {
    waktu: `${todayStr}T07:18:24.000Z`,
    koordinat: {
      lat: -7.55835,
      lng: 110.85756,
    },
    fotoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    isValidLocation: true,
    alamat: "Jl. Ki Hajar Dewantara No.19, Jebres, Solo Teknopark",
    kantorId: "kantor-stp",
    namaKantor: "Solo Teknopark",
    jarakMeter: 12,
  },
};

/**
 * Generator Riwayat Presensi 30 Hari Realistis
 */
export function generateSeedPresensiHistory(userId: string = SEED_FIREBASE_UIDS.pegawai): PresensiRecord[] {
  const records: PresensiRecord[] = [SEED_PRESENSI_SAMPLE];
  const baseDate = new Date();

  for (let i = 1; i <= 29; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);

    const dayOfWeek = d.getDay();
    // Lewati akhir pekan (Sabtu = 6, Minggu = 0)
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const tgl = d.toISOString().split("T")[0];
    const isLate = i === 4 || i === 12; // 2 kali terlambat wajar
    const isIzin = i === 18; // 1 kali dinas luar
    const isCuti = i === 24; // 1 kali cuti

    let status: PresensiRecord["status"] = "hadir";
    let inHour = "07";
    let inMinute = (12 + (i % 14)).toString().padStart(2, "0");

    if (isLate) {
      status = "terlambat";
      inHour = "07";
      inMinute = (36 + (i % 8)).toString().padStart(2, "0");
    } else if (isIzin) {
      status = "izin";
    } else if (isCuti) {
      status = "cuti";
    }

    const checkInTime = `${tgl}T${inHour}:${inMinute}:15.000Z`;
    const checkOutTime = `${tgl}T16:${(10 + (i % 25)).toString().padStart(2, "0")}:00.000Z`;

    records.push({
      id: `${userId}_${tgl}`,
      userId,
      nip: "19920817 201801 1 002",
      nama: "Budi Santoso, S.Kom.",
      orgId: "org-surakarta",
      tanggal: tgl,
      kantorId: "kantor-stp",
      namaKantor: "Solo Teknopark",
      status,
      durasiKerjaMenit: isIzin || isCuti ? 0 : 510 + (i % 20),
      checkIn: isIzin || isCuti ? undefined : {
        waktu: checkInTime,
        koordinat: { lat: -7.558392, lng: 110.857528 },
        fotoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
        isValidLocation: true,
        alamat: "Solo Teknopark, Jebres",
        kantorId: "kantor-stp",
        namaKantor: "Solo Teknopark",
        jarakMeter: 15,
      },
      checkOut: isIzin || isCuti ? undefined : {
        waktu: checkOutTime,
        koordinat: { lat: -7.558392, lng: 110.857528 },
        fotoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
        isValidLocation: true,
        alamat: "Solo Teknopark, Jebres",
        kantorId: "kantor-stp",
        namaKantor: "Solo Teknopark",
        jarakMeter: 18,
      },
    });
  }

  return records;
}

/**
 * 2 Contoh LKH Bawahan yang diajukan ke Atasan (Menunggu Persetujuan / submitted)
 */
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split("T")[0];

export const SEED_PENDING_LKH_LIST: LKHRecord[] = [
  {
    id: `${SEED_FIREBASE_UIDS.pegawai}_${yesterdayStr}`,
    userId: SEED_FIREBASE_UIDS.pegawai,
    nip: "19920817 201801 1 002",
    nama: "Budi Santoso, S.Kom.",
    orgId: "org-surakarta",
    tanggal: yesterdayStr,
    status: "submitted",
    totalPoinHarian: 320,
    targetPoinHarian: 300,
    isTargetTercapai: true,
    catatanPegawai: "Pengembangan modul presensi & peta GPS Solo Teknopark selesai dikerjakan sesuai arahan.",
    kegiatan: [
      {
        id: "keg-seed-1",
        aktivitasId: 41,
        namaAktivitasBaku: "Membuat laporan / telaahan teknis",
        kategoriAktivitas: "Persuratan",
        deskripsi: "Menyusun telaahan arsitektur sistem presensi berbasis GPS di lingkungan Solo Teknopark",
        outputKegiatan: "Dokumen Telaahan Teknis Arsitektur",
        volumeKegiatan: 1,
        satuanKegiatan: "Per dokumen",
        jamMulai: "08:00",
        jamSelesai: "11:30",
        nilaiPoin: 120,
        totalPoin: 120,
      },
      {
        id: "keg-seed-2",
        aktivitasId: 111,
        namaAktivitasBaku: "Mengikuti rapat koordinasi",
        kategoriAktivitas: "Manajerial",
        deskripsi: "Rapat koordinasi teknis integrasi database bersama atasan divisi inovasi",
        outputKegiatan: "Notula Rapat Koordinasi",
        volumeKegiatan: 1,
        satuanKegiatan: "Per kegiatan",
        jamMulai: "13:00",
        jamSelesai: "15:30",
        nilaiPoin: 200,
        totalPoin: 200,
      },
    ],
    createdAt: `${yesterdayStr}T09:00:00.000Z`,
    updatedAt: `${yesterdayStr}T16:00:00.000Z`,
  },
  {
    id: `user-asn-003_${yesterdayStr}`,
    userId: SEED_PEGAWAI_2.id,
    nip: SEED_PEGAWAI_2.nip,
    nama: SEED_PEGAWAI_2.nama,
    orgId: "org-surakarta",
    tanggal: yesterdayStr,
    status: "submitted",
    totalPoinHarian: 340,
    targetPoinHarian: 300,
    isTargetTercapai: true,
    catatanPegawai: "Pengujian fungsional modul logbook harian dan pengisian kegiatan SKP ASN.",
    kegiatan: [
      {
        id: "keg-seed-3",
        aktivitasId: 15,
        namaAktivitasBaku: "Melakukan pengujian dan evaluasi sistem",
        kategoriAktivitas: "Teknis",
        deskripsi: "Verifikasi alur approval berjenjang dari staf pelaksana ke kepala divisi",
        outputKegiatan: "Laporan Hasil Pengujian Sistem",
        volumeKegiatan: 1,
        satuanKegiatan: "Per laporan",
        jamMulai: "08:30",
        jamSelesai: "12:00",
        nilaiPoin: 180,
        totalPoin: 180,
      },
      {
        id: "keg-seed-4",
        aktivitasId: 22,
        namaAktivitasBaku: "Melakukan pemeliharaan basis data",
        kategoriAktivitas: "Teknis",
        deskripsi: "Sinkronisasi kamus aktivitas kerja 50+ item dengan kategori SKP BKN",
        outputKegiatan: "Log Pemeliharaan Data",
        volumeKegiatan: 1,
        satuanKegiatan: "Per kegiatan",
        jamMulai: "13:00",
        jamSelesai: "15:30",
        nilaiPoin: 160,
        totalPoin: 160,
      },
    ],
    createdAt: `${yesterdayStr}T09:30:00.000Z`,
    updatedAt: `${yesterdayStr}T16:00:00.000Z`,
  },
];

export const SEED_LKH_SAMPLE = SEED_PENDING_LKH_LIST[0];

// In-Memory Dev State Stores (Hanya digunakan saat process.env.NODE_ENV === 'development')
declare global {
  // eslint-disable-next-line no-var
  var __DEV_PRESENSI_STORE__: Map<string, PresensiRecord> | undefined;
  // eslint-disable-next-line no-var
  var __DEV_LKH_STORE__: Map<string, LKHRecord> | undefined;
  // eslint-disable-next-line no-var
  var __DEV_USERS_STORE__: Map<string, UserProfile> | undefined;
}

export function getDevUsersStore(): Map<string, UserProfile> {
  if (!globalThis.__DEV_USERS_STORE__) {
    const map = new Map<string, UserProfile>();
    map.set(SEED_USERS.admin.id, SEED_USERS.admin);
    map.set(SEED_USERS.atasan.id, SEED_USERS.atasan);
    map.set(SEED_USERS.pegawai.id, SEED_USERS.pegawai);
    map.set(SEED_PEGAWAI_2.id, SEED_PEGAWAI_2);
    globalThis.__DEV_USERS_STORE__ = map;
  }
  return globalThis.__DEV_USERS_STORE__;
}

export function addDevUser(user: UserProfile): void {
  getDevUsersStore().set(user.id, user);
}

export function deleteDevUser(userId: string): boolean {
  return getDevUsersStore().delete(userId);
}

export function getDevPresensiStore(): Map<string, PresensiRecord> {
  if (!globalThis.__DEV_PRESENSI_STORE__) {
    const map = new Map<string, PresensiRecord>();
    const list = generateSeedPresensiHistory();
    list.forEach((p) => map.set(p.id, p));
    globalThis.__DEV_PRESENSI_STORE__ = map;
  }
  return globalThis.__DEV_PRESENSI_STORE__;
}

export function getDevLKHStore(): Map<string, LKHRecord> {
  if (!globalThis.__DEV_LKH_STORE__) {
    const map = new Map<string, LKHRecord>();
    SEED_PENDING_LKH_LIST.forEach((l) => map.set(l.id, l));
    globalThis.__DEV_LKH_STORE__ = map;
  }
  return globalThis.__DEV_LKH_STORE__;
}
