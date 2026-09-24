export type UserRole = "admin" | "atasan" | "pegawai";

export type PresensiStatus =
  | "hadir"
  | "terlambat"
  | "izin"
  | "sakit"
  | "cuti"
  | "dinas"
  | "alpa"
  | "libur"
  | "lembur";

export type LKHStatus = "draft" | "submitted" | "approved" | "rejected";

export type LemburStatus =
  | "draft"
  | "diajukan"
  | "disetujui"
  | "ditolak"
  | "selesai";

export type LemburJenis = "hari_kerja" | "hari_libur" | "hari_raya";

export interface UserProfile {
  id: string;
  nip: string;
  accessCode?: string; // Digunakan sebagai alternatif login jika bukan PNS
  nama: string;
  email: string;
  role: UserRole;
  jabatan: string;
  golongan: string; // misal: III/a, IV/b
  instansi: string; // misal: Badan Kepegawaian Daerah
  departmentId: string;
  departmentName: string;
  atasanId?: string;
  atasanNama?: string;
  fotoUrl?: string;
  orgId: string;
  nomorHp?: string;
  kantorId?: string;
  namaKantor?: string;
  allowedKantorIds?: string[];
  storageUsedBytes: number; // Bytes terpakai saat ini
  storageLimitBytes: number; // 1 GB = 1073741824 bytes
  createdAt?: string;
}

export type KategoriKantor =
  | "Pusat"
  | "OPD / Dinas"
  | "Kecamatan"
  | "Kelurahan"
  | "UPTD"
  | "Puskesmas"
  | "Kawasan Khusus";

export interface KantorUnit {
  id: string;
  kodeKantor: string;
  namaKantor: string;
  kategori: KategoriKantor;
  alamat: string;
  koordinat: GeolocationPoint;
  radiusMeter: number;
  jamMasukMaksimal?: string;
  jamPulangMinimal?: string;
  orgId: string;
  isActive: boolean;
}

export interface UploadedFileMetadata {
  id: string;
  userId: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  url: string;
  uploadedAt: string;
  kegiatanId?: string;
  kegiatanDeskripsi?: string;
  type: "foto" | "dokumen";
}

export interface GeolocationPoint {
  lat: number;
  lng: number;
}

export interface PresensiCheckPoint {
  waktu: string; // ISO string
  koordinat: GeolocationPoint;
  fotoUrl: string;
  isValidLocation: boolean;
  kantorId?: string;
  namaKantor?: string;
  jarakMeter?: number;
  serverVerifiedDistanceMeter?: number;
  alamat?: string;
  catatan?: string;
  ipAddress?: string;
  userAgent?: string;
  gpsAccuracyMeter?: number;
  isMockDetected?: boolean;
  isSuspiciousTravel?: boolean;
}

export interface PresensiRecord {
  id: string;
  userId: string;
  nip: string;
  nama: string;
  orgId: string;
  tanggal: string; // Format: YYYY-MM-DD
  shiftId?: string; // e.g. 'pagi', 'siang', 'malam' (untuk multi-shift)
  kantorId?: string;
  namaKantor?: string;
  checkIn?: PresensiCheckPoint;
  checkOut?: PresensiCheckPoint;
  status: PresensiStatus;
  durasiKerjaMenit?: number;
  keterangan?: string;
  suratIzinUrl?: string;
  izinId?: string;
  lemburRecordId?: string;
}

export interface LKHItem {
  id: string;
  aktivitasId?: number; // Referensi ID dari Master Aktivitas 152
  kategoriAktivitas?: string; // 'Persuratan' | 'Manajerial' | 'Pelayanan' | dll.
  namaAktivitasBaku?: string;
  deskripsi: string;
  outputKegiatan: string;
  volumeKegiatan: number;
  satuanKegiatan: string; // misal: Berkas, Dokumen, Kegiatan, Laporan
  jamMulai: string; // '08:00'
  jamSelesai: string; // '10:00'
  nilaiPoin: number; // Poin satuan standar
  totalPoin: number; // volumeKegiatan * nilaiPoin
  lampiranFotoUrls?: string[];
  lampiranDokumenUrls?: string[];
}

export interface LKHRecord {
  id: string;
  userId: string;
  nip: string;
  nama: string;
  orgId: string;
  tanggal: string; // Format: YYYY-MM-DD
  atasanId?: string; // ID atasan langsung penilai
  atasanNama?: string; // Nama atasan langsung (denormalized)
  kegiatan: LKHItem[];
  totalPoinHarian: number; // Akumulasi total poin harian
  targetPoinHarian: number; // Minimal 300 Poin
  isTargetTercapai: boolean;
  status: LKHStatus;
  catatanPegawai?: string;
  catatanAtasan?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfficeLocationConfig {
  namaKantor: string;
  alamat: string;
  koordinat: GeolocationPoint;
  radiusMeter: number;
  jamMasukMaksimal: string; // '07:30'
  jamPulangMinimal: string; // '16:00'
}

export interface PengajuanIzinItem {
  id: string;
  userId: string;
  nama: string;
  nip: string;
  orgId: string;
  atasanId: string;
  jenis: "Cuti Tahunan" | "Izin Alasan Penting" | "Sakit" | "Dinas Luar";
  tanggalMulai: string;
  tanggalSelesai: string;
  jumlahHari: number;
  alasan: string;
  dokumenUrl?: string;
  dokumenNama?: string;
  status: "menunggu" | "disetujui" | "ditolak";
  createdAt: string;
}

export interface CheckInPayload {
  userId: string;
  nip: string;
  nama: string;
  orgId: string;
  tanggal: string; // YYYY-MM-DD
  shiftId?: string;
  kantorId?: string;
  namaKantor?: string;
  jarakMeter?: number;
  koordinat: GeolocationPoint;
  fotoUrl: string;
  isValidLocation: boolean;
  alamat?: string;
  catatan?: string;
  gpsAccuracyMeter?: number;
  isMockDetected?: boolean;
}

export interface CheckOutPayload {
  userId: string;
  tanggal: string; // YYYY-MM-DD
  shiftId?: string;
  kantorId?: string;
  namaKantor?: string;
  jarakMeter?: number;
  koordinat: GeolocationPoint;
  fotoUrl: string;
  isValidLocation: boolean;
  alamat?: string;
  catatan?: string;
  gpsAccuracyMeter?: number;
  isMockDetected?: boolean;
}

// ============================================================
// LEMBUR (Overtime) Types
// ============================================================

export interface LemburRecord {
  id: string;
  userId: string;
  nip: string;
  nama: string;
  orgId: string;
  tanggal: string; // YYYY-MM-DD
  jenis: LemburJenis;
  alasanLembur: string;
  jamMulaiRencana: string; // 'HH:mm'
  jamSelesaiRencana: string; // 'HH:mm'
  atasanId: string;
  atasanNama: string;
  status: LemburStatus;
  checkInLembur?: PresensiCheckPoint;
  checkOutLembur?: PresensiCheckPoint;
  durasiLemburMenit?: number;
  suratPerintahLemburUrl?: string;
  catatanAtasan?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
  presensiRecordId?: string;
}

export interface PengajuanLemburPayload {
  userId: string;
  nip: string;
  nama: string;
  orgId: string;
  tanggal: string; // YYYY-MM-DD
  jenis: LemburJenis;
  alasanLembur: string;
  jamMulaiRencana: string;
  jamSelesaiRencana: string;
  atasanId: string;
  atasanNama: string;
  suratPerintahLemburUrl?: string;
}

export interface CheckInLemburPayload {
  userId: string;
  tanggal: string;
  kantorId?: string;
  namaKantor?: string;
  jarakMeter?: number;
  koordinat: GeolocationPoint;
  fotoUrl: string;
  isValidLocation: boolean;
  alamat?: string;
  gpsAccuracyMeter?: number;
  isMockDetected?: boolean;
}

export interface CheckOutLemburPayload {
  userId: string;
  tanggal: string;
  kantorId?: string;
  namaKantor?: string;
  jarakMeter?: number;
  koordinat: GeolocationPoint;
  fotoUrl: string;
  isValidLocation: boolean;
  alamat?: string;
  gpsAccuracyMeter?: number;
  isMockDetected?: boolean;
}

// ============================================================
// ORGANIZATION / TENANT (White-Label) Types
// ============================================================

export interface OrganizationConfig {
  id: string; // orgId (e.g. 'org-surakarta', 'org-rsud')
  name: string;
  logoUrl?: string;
  themeColor?: string;
  defaultJamMasukMaksimal: string; // '07:30'
  defaultJamPulangMinimal: string; // '16:00'
  timezone?: string; // 'Asia/Jakarta'
  createdAt: string;
  updatedAt: string;
}

