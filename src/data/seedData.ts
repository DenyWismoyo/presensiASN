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
export const SEED_USERS: Record<UserRole, UserProfile> = {
  admin: {
    id: "user-asn-000",
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
    id: "user-asn-002",
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
    id: "user-asn-001",
    nip: "19920817 201801 1 002",
    nama: "Budi Santoso, S.Kom.",
    email: "budi.santoso@surakarta.go.id",
    role: "pegawai",
    jabatan: "Pranata Komputer Ahli Pertama",
    golongan: "III/a - Penata Muda",
    instansi: "Pemerintah Kota Surakarta - Solo Teknopark",
    departmentId: "dept-inovasi-stp",
    departmentName: "Subdivisi Rekayasa Perangkat Lunak & AI",
    atasanId: "user-asn-002",
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
 * Rekap Presensi Awal Demo
 */
export const SEED_PRESENSI_SAMPLE: PresensiRecord = {
  id: "user-asn-001_2026-09-16",
  userId: "user-asn-001",
  nip: "19920817 201801 1 002",
  nama: "Budi Santoso, S.Kom.",
  orgId: "org-surakarta",
  tanggal: "2026-09-16",
  kantorId: "kantor-stp",
  namaKantor: "Solo Teknopark (Pusat Vokasi & Inovasi)",
  status: "hadir",
  checkIn: {
    waktu: "2026-09-16T07:18:24.000Z",
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
 * Contoh 1 LKH Bawahan yang diajukan ke Atasan
 */
export const SEED_LKH_SAMPLE: LKHRecord = {
  id: "user-asn-001_2026-09-15",
  userId: "user-asn-001",
  nip: "19920817 201801 1 002",
  nama: "Budi Santoso, S.Kom.",
  orgId: "org-surakarta",
  tanggal: "2026-09-15",
  status: "submitted",
  totalPoinHarian: 320,
  targetPoinHarian: 300,
  isTargetTercapai: true,
  catatanPegawai: "Laporan harian pengembangan modul sistem Solo Teknopark telah selesai dikerjakan.",
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
      deskripsi: "Rapat koordinasi teknis integrasi database bersama atasan divisi",
      outputKegiatan: "Notula Rapat Koordinasi",
      volumeKegiatan: 1,
      satuanKegiatan: "Per kegiatan",
      jamMulai: "13:00",
      jamSelesai: "15:30",
      nilaiPoin: 200,
      totalPoin: 200,
    },
  ],
  createdAt: "2026-09-15T09:00:00.000Z",
  updatedAt: "2026-09-15T16:00:00.000Z",
};
