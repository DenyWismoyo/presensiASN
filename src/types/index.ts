export type UserRole = "admin" | "atasan" | "pegawai";

export type PresensiStatus =
  | "hadir"
  | "terlambat"
  | "izin"
  | "sakit"
  | "cuti"
  | "alpa"
  | "libur";

export type LKHStatus = "draft" | "submitted" | "approved" | "rejected";

export interface UserProfile {
  id: string;
  nip: string;
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
  alamat?: string;
  catatan?: string;
}

export interface PresensiRecord {
  id: string;
  userId: string;
  nip: string;
  nama: string;
  orgId: string;
  tanggal: string; // Format: YYYY-MM-DD
  kantorId?: string;
  namaKantor?: string;
  checkIn?: PresensiCheckPoint;
  checkOut?: PresensiCheckPoint;
  status: PresensiStatus;
  durasiKerjaMenit?: number;
  keterangan?: string;
  suratIzinUrl?: string;
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
