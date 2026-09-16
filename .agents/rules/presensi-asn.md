# 📋 Rules: Presensi ASN — Project-Specific Rules

## Stack Wajib
- **Framework**: Next.js 14+ (App Router) — WAJIB gunakan App Router, bukan Pages Router
- **Auth & Database**: Firebase (Firestore, Auth, Storage, Functions)
- **Styling**: Tailwind CSS v3 + shadcn/ui (component library utama)
- **Language**: TypeScript — WAJIB, jangan gunakan JavaScript biasa
- **Package Manager**: pnpm — selalu gunakan `pnpm` bukan `npm` atau `yarn`

## Library Standar Proyek
Selalu gunakan library berikut sesuai kebutuhan:
- `react-hook-form` + `zod` — form validation
- `@tanstack/react-query` — server state management & caching
- `date-fns` — date/time manipulation
- `lucide-react` — icon library (sudah include di shadcn/ui)
- `next-auth` v5 / atau Firebase Auth — authentication
- `react-dropzone` — file/foto upload
- `sharp` — image optimization (server-side)
- `recharts` — chart & statistik presensi
- `jspdf` + `xlsx` — export laporan PDF/Excel

## Konvensi Kode
- Gunakan **Server Components** sebagai default; tambahkan `"use client"` hanya jika perlu interaktivitas
- Semua API calls harus melalui **Route Handlers** (`app/api/`) atau **Server Actions**
- **Project Firebase Resmi**: `teknopark-surakarta`
- **Firestore Named Database**: Wajib gunakan database `"presensi-pegawai"`:
  `getFirestore(app, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "presensi-pegawai")`
- **Firebase Storage Root**: Wajib gunakan prefix namespace `"presensi-pegawai/"`:
  `presensi-pegawai/{orgId}/{userId}/{year}/{month}/{filename}`
- Firestore rules harus ketat: pegawai hanya bisa akses data sendiri, admin bisa semua
- Semua tanggal disimpan dalam format ISO 8601 UTC di Firestore

## Struktur Folder Next.js
```
src/
  app/
    (auth)/         # layout auth (login, register)
    (dashboard)/    # layout utama dashboard
      presensi/     # modul presensi
      laporan/      # modul laporan kegiatan
      admin/        # modul admin
  components/
    ui/             # shadcn components (jangan edit langsung)
    presensi/       # komponen domain presensi
    laporan/        # komponen domain laporan
    shared/         # komponen shared
  lib/
    firebase/       # firebase config & helpers
    utils/          # utility functions
  hooks/            # custom React hooks
  types/            # TypeScript type definitions
  actions/          # Server Actions
```

## Fitur Wajib Presensi
- Check-in / Check-out dengan timestamp & koordinat GPS (Geolocation API)
- Foto selfie saat presensi (wajib upload ke Storage)
- Validasi lokasi (geofencing sederhana — radius dari kantor)
- Status presensi: Hadir, Terlambat, Izin, Sakit, Cuti, Alpa
- Rekap bulanan otomatis per pegawai
- Export rekap ke Excel/PDF

## Fitur Wajib Laporan Kegiatan Harian (LKH)
- Form pengisian kegiatan harian dengan deskripsi
- Upload bukti foto kegiatan (multiple files, max 5MB/file)
- Upload dokumen pendukung (PDF, Word, Excel — max 10MB)
- Status LKH: Draft, Submitted, Approved, Rejected
- Approval workflow: Pegawai → Atasan Langsung → Admin

## Security Rules Firestore (Prinsip)
- Collection `users`: admin bisa write, user hanya bisa read/update profil sendiri
- Collection `presensi`: user hanya bisa create untuk diri sendiri, read semua milik sendiri; admin bisa read semua
- Collection `lkh`: user bisa CRUD milik sendiri (kecuali yang sudah Approved); atasan bisa approve/reject

## Penamaan
- File komponen: PascalCase (`PresensiCard.tsx`)
- File utility/hooks: camelCase (`usePresensi.ts`, `formatDate.ts`)
- Firestore collections: camelCase plural (`users`, `presensiRecords`, `lkhRecords`, `organizations`)
- ENV variables: prefix `NEXT_PUBLIC_` untuk client-side, tanpa prefix untuk server-only

## Larangan
- ❌ Jangan gunakan `any` di TypeScript
- ❌ Jangan expose Firebase Admin SDK ke client
- ❌ Jangan simpan file credential Firebase di repo (gunakan .env.local)
- ❌ Jangan gunakan `useEffect` untuk data fetching — gunakan React Query atau Server Components

## Standar Desain Mobile-First & Tampilan Ponsel (PWA)
- **Prioritas Mobile-First**: Semua halaman dan modul (Login, Dashboard, Presensi, LKH) WAJIB didesain responsif untuk layar ponsel (min. 360px - 430px) tanpa overflow horizontal.
- **Navigasi Ganda (Desktop & Mobile)**:
  - Desktop (>= 768px): Gunakan Sidebar kiri permanen.
  - Mobile (< 768px): Sidebar disembunyikan; gunakan **Mobile Bottom Navigation Bar** tetap (fixed bottom) dengan padding bawah (`pb-24`) pada konten utama.
- **Kamera Presensi Vertikal**:
  - Di layar ponsel, frame kamera swafoto harus berorientasi portrait (rasio 3:4 atau 4:5 vertikal), menyerupai antarmuka kamera smartphone asli dengan tombol shutter melingkar di bawah.
- **Formulir LKH Adaptif**:
  - Pada ponsel, gunakan tab switcher atau accordion antara "Form Input" dan "Daftar Kegiatan" agar pengguna tidak perlu scrolling berlebih.
- **Touch Targets**:
  - Tombol utama minimal `h-11` (44px) dengan jarak antar tombol yang nyaman untuk jempol.

## Kebijakan Kuota Penyimpanan ASN (1 ASN = 1 GB Storage)
- **Alokasi Kuota**: Setiap pegawai ASN dibatasi maksimal **1 GB (1.073.741.824 bytes)** untuk seluruh berkas unggahan (presensi selfie, foto kegiatan LKH, dan dokumen lampiran).
- **Pelacakan Kapasitas**: Sistem wajib melacak `storageUsedBytes` dan `storageLimitBytes` di dokumen profil pengguna Firestore.
- **Indikator Visual (Storage Meter)**: Wajib menampilkan visual progress bar kapasitas penyimpanan di halaman LKH dan Profil ASN.
- **Validasi Pre-Upload**:
  - Sistem wajib memvalidasi sisa kuota sebelum file diunggah. Jika ukuran file melebihi sisa kuota, tolak dengan pesan edukatif.
  - Kompresi gambar client/server-side wajib diutamakan (max 1080p, quality 80%) agar menghemat kuota ASN.
- **Manajemen Berkas Mandiri**: Pegawai dapat melihat daftar berkas yang diunggah dan menghapus berkas lampiran draft untuk membebaskan ruang penyimpanan.

## Standar Master Aktivitas & Mekanisme Logbook Kinerja Harian
- **Kamus 152 Master Aktivitas**: Seluruh pelaporan LKH/Logbook harian wajib terhubung dengan basis data 152 Master Aktivitas resmi ASN yang mencakup Satuan Baku, Kategori, dan Nilai Poin.
- **Target Capaian Harian**: Sistem wajib menghitung total akumulasi poin per hari dengan target minimal **300 Poin** (indikator visual status: Belum Tercapai / Target Terpenuhi).
- **Smart Activity Detection**: Form pengisian kegiatan dilengkapi fitur deteksi cerdas untuk mencocokkan teks deskripsi bebas pegawai ke aktivitas resmi secara otomatis.
- **Kombinasi Bukti Kinerja & Kuota 1 GB**: Setiap kegiatan dalam logbook dapat dilampiri foto dokumentasi/dokumen PDF yang terkontrol dalam batas alokasi 1 GB per ASN.

---

## Status Implementasi Saat Ini (September 2026)

> ⚠️ **Phase Aktif: Demo/Mock → Production Hydration**
> Fondasi UI/UX sudah solid. Prioritas sekarang adalah menghubungkan semua data ke Firebase nyata.

| Modul | Status | Prioritas |
|-------|--------|-----------|
| Auth Firebase (signIn nyata) | ❌ Masih mock localStorage | 🔴 KRITIS |
| Firestore Presensi | ❌ Hanya useState lokal | 🔴 KRITIS |
| Firestore LKH | ❌ Hanya useState lokal | 🔴 KRITIS |
| Firebase Storage Upload | ❌ Simulasi dummy URL | 🔴 KRITIS |
| Dashboard Atasan (approval) | ❌ Belum ada halaman | 🟡 TINGGI |
| Dashboard Admin | ❌ Belum ada halaman | 🟡 TINGGI |
| Kalender Kehadiran Bulanan | ❌ Belum ada halaman | 🟡 TINGGI |
| Pengajuan Izin/Cuti | ❌ Belum ada halaman | 🟡 TINGGI |

---

## Konvensi Custom Hooks Firestore (Wajib)

Semua data fetching ke Firestore **wajib** menggunakan custom hook di `src/hooks/`.
Jangan fetch Firestore langsung di dalam komponen/page.

Hook yang harus dibuat:
- `usePresensiHarian(userId, tanggal)` — fetch 1 record presensi hari ini
- `usePresensiHistori(userId, bulan, tahun)` — fetch rekap bulanan (kalender)
- `useLKHHarian(userId, tanggal)` — fetch LKH hari ini + auto-create draft
- `useLKHPending(atasanId)` — list LKH pending untuk dashboard atasan
- `useUserProfile(userId)` — fetch profil + storageUsedBytes real-time
- `useRekapBulanan(orgId, bulan, tahun)` — rekap instansi untuk admin

Semua hooks **wajib** menggunakan `@tanstack/react-query` dengan pola `queryKey` ini:
```typescript
queryKey: ['presensi', userId, tanggal]
queryKey: ['lkh', userId, tanggal]
queryKey: ['lkh-pending', atasanId]
queryKey: ['rekap', orgId, bulan, tahun]
```

---

## Konvensi Server Actions (Wajib untuk Write)

Semua operasi **WRITE** ke Firestore (create/update/delete) wajib menggunakan Server Actions di `src/actions/`. Jangan write Firestore langsung dari Client Component.

File yang harus ada:
```
src/actions/
  presensi.ts    — checkIn(), checkOut(), inputIzin(), updateStatusPresensi()
  lkh.ts         — saveDraftLKH(), submitLKH(), approveLKH(), rejectLKH()
  storage.ts     — uploadFotoPresensi(), uploadFotoKegiatan(), hapusBerkas()
  user.ts        — updateProfilPegawai(), updateStorageUsed()
```

---

## Halaman Yang Harus Dibuat (Backlog Terurut)

```
src/app/(dashboard)/
  kalender/page.tsx   — Kalender presensi bulanan visual per pegawai (Recharts/react-big-calendar)
  atasan/page.tsx     — Dashboard atasan: list LKH pending, rekap bawahan, approve/reject
  admin/page.tsx      — Admin panel: CRUD pegawai, rekap instansi, setting kantor
  izin/page.tsx       — Form pengajuan izin/sakit/cuti + upload surat digital
src/hooks/            — Custom Firestore hooks (semua di atas)
src/actions/          — Server Actions write (semua di atas)
```

---

## Pola Firebase Auth (Menggantikan Mock)

```typescript
// src/lib/firebase/auth-helpers.ts
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from './config'

// NIP dikonversi ke email: "199208172018011002" → "199208172018011002@asn.go.id"
export function nipToEmail(nip: string): string {
  const clean = nip.replace(/\s/g, '')
  return `${clean}@asn.go.id`
}

export async function loginASN(nipOrEmail: string, password: string) {
  const email = nipOrEmail.includes('@') ? nipOrEmail : nipToEmail(nipOrEmail)
  return signInWithEmailAndPassword(auth, email, password)
}
```

---

## Standar Multi-Kantor Geofencing ASN
- **Arsitektur Multi-Kantor**:
  - Aplikasi mendukung banyak unit kantor terpisah dalam satu instansi pemerintah/OPD/wilayah pemkot (Pusat Balaikota, OPD Dinas, Kantor Kecamatan, Kawasan Khusus/Solo Teknopark).
- **Struktur Entitas Kantor (`KantorUnit`)**:
  - `id`: identifier unik kantor (e.g. `kantor-stp`, `kantor-balaikota`)
  - `kodeKantor`: kode singkat (e.g. `STP-01`, `SETDA-01`, `BKPSDM-01`)
  - `namaKantor`: nama resmi instansi
  - `kategori`: `Pusat` | `OPD / Dinas` | `Kecamatan` | `Kelurahan` | `UPTD / Sekolah` | `Kawasan Khusus`
  - `koordinat`: `{ lat: number, lng: number }` (presisi satelit GPS)
  - `radiusMeter`: radius batas geofence toleransi (default 120m - 200m)
  - `jamMasukMaksimal` & `jamPulangMinimal`: jam kerja fleksibel per kantor
  - `orgId`: ID organisasi/pemerintah kota
  - `isActive`: boolean status penerimaan presensi
- **Kalkulasi Jarak & Deteksi Otomatis**:
  - Gunakan formula **Haversine** (`calculateHaversineDistance` di `src/data/masterKantor.ts`) untuk presisi kurvatur bumi.
  - Sediakan **Auto-Detection** (`detectNearestOffice`) untuk memilih kantor terdekat secara cerdas berdasarkan GPS aktual pegawai.
- **Koleksi Firestore**:
  - Master titik kantor disimpan pada koleksi `kantor` di database `"presensi-pegawai"`.
- **Integritas Rekam Presensi**:
  - Setiap record check-in/check-out wajib menyertakan `kantorId`, `namaKantor`, `jarakMeter`, dan `isValidLocation` agar atasan dapat memverifikasi presensi di kantor tujuan/tugas luar.
