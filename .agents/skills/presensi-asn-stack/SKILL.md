---
name: presensi-asn-stack
description: Cheatsheet lengkap stack, pola Firestore, dan konvensi kode untuk project Presensi & LKH ASN. Gunakan saat membuat fitur baru, debugging, atau integrasi Firebase.
---

# Stack Cheatsheet - Sistem Presensi & LKH ASN

## Tech Stack Resmi Proyek

| Layer | Library | Catatan |
|-------|---------|---------|
| Framework | Next.js 16+ (App Router) | WAJIB App Router, dan file middleware usang diganti ke src/proxy.ts |
| Auth | Firebase Auth v10 | signInWithEmailAndPassword |
| Database | Firestore v10 | real-time, offline support |
| Storage | Firebase Storage v10 | path: {orgId}/{userId}/{year}/{month}/ |
| Styling | Tailwind CSS v3 + shadcn/ui | utility-first, jangan custom dari scratch |
| Server State | TanStack Query v5 | semua Firestore read pakai ini |
| Forms | React Hook Form + Zod | type-safe validation |
| Charts | Recharts v2 | presensi stat, kinerja grafik |
| Export | jspdf + xlsx | format laporan resmi instansi |
| Icons | lucide-react | sudah include di shadcn/ui |
| Package | pnpm | jangan npm/yarn |
| Language | TypeScript | wajib, jangan ny |

---

## Pola Standar: Custom Hook Firestore (Read)

Semua data fetching ke Firestore WAJIB menggunakan custom hook di src/hooks/.

`	ypescript
// src/hooks/usePresensiHarian.ts
import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { PresensiRecord } from '@/types'

export function usePresensiHarian(userId: string, tanggal: string) {
  return useQuery({
    queryKey: ['presensi', userId, tanggal],
    queryFn: async () => {
      const ref = doc(db, 'presensi', ${userId}_)
      const snap = await getDoc(ref)
      return snap.exists() ? (snap.data() as PresensiRecord) : null
    },
    enabled: !!userId && !!tanggal,
    staleTime: 1000 * 60 * 5,
  })
}
`

queryKey conventions:
- ['presensi', userId, tanggal] - 1 record presensi hari ini
- ['presensi-histori', userId, bulan] - rekap bulanan
- ['lkh', userId, tanggal] - LKH hari ini
- ['lkh-pending', atasanId] - list untuk approval atasan
- ['rekap-instansi', orgId, bulan] - rekap admin
- ['user-profile', userId] - profil + storage usage
- ['kantor-list', orgId] - daftar titik kantor geofence aktif

---

## Pola Standar: Server Action (Write ke Firestore)

**Pola Hardening (Update Phase 3) - WAJIB DIIKUTI:**
1. **Zod Validation**: Panggil `<Schema>.safeParse(payload)` di awal fungsi (skema ada di `src/lib/validations.ts`). Tolak request jika tidak valid.
2. **Multi-Shift Doc ID**: ID dokumen presensi adalah kombinasi dari `{userId}_{tanggal}_{shiftId}`.
3. **Audit Log Terpusat**: Panggil `await recordAuditLog({ action, entityType, entityId, details, ipAddress, userAgent })` pada semua aksi mutasi (CREATE/UPDATE/DELETE/APPROVE/REJECT).
4. **FCM Notifikasi**: Untuk aksi *approval* LKH/Lembur/Izin, panggil `await sendPushNotification({ userId, title, body })` untuk memberi update ke klien.

Semua operasi WRITE ke Firestore wajib via Server Actions di src/actions/.

`	ypescript
// src/actions/presensi.ts
'use server'
import { adminDb } from '@/lib/firebase/admin'
import { PresensiCheckPoint } from '@/types'

export async function checkInAction(userId: string, orgId: string, data: PresensiCheckPoint) {
  const tanggal = new Date().toISOString().split('T')[0]
  const docId = ${userId}_
  await adminDb.collection('presensi').doc(docId).set(
    { userId, orgId, tanggal, checkIn: data, status: 'hadir', updatedAt: new Date().toISOString() },
    { merge: true }
  )
  return { success: true, docId }
}
`

---

## Pola Multi-Kantor Geofencing ASN

- **Master Data**: src/data/masterKantor.ts (DEFAULT_KANTOR_LIST, calculateHaversineDistance, detectNearestOffice)
- **Server Actions**: src/actions/kantor.ts (getKantorList, saveKantor, deleteKantor)
- **Custom Hook**: src/hooks/useKantor.ts (useKantorList, useSaveKantorMutation, useDeleteKantorMutation)
- **Geofence Calculation**:
  `	ypescript
  import { calculateHaversineDistance, detectNearestOffice } from '@/data/masterKantor'
  
  // Deteksi otomatis kantor terdekat dari koordinat GPS satelit:
  const { nearestOffice, distanceMeters, isWithinRadius, allOfficesWithDistance } = 
    detectNearestOffice(userCoords, kantorList)
  `
- **Presensi Payload**:
  Check-in dan check-out wajib menyertakan kantorId, 
amaKantor, jarakMeter, koordinat, dan isValidLocation.

---

## Firestore Collection Schema

presensi/{userId}_{YYYY-MM-DD}:
  userId, nip, nama, orgId, tanggal
  kantorId?: string, namaKantor?: string
  checkIn?: { waktu, koordinat: {lat,lng}, fotoUrl, isValidLocation, kantorId, namaKantor, jarakMeter }
  checkOut?: { ... same }
  status: 'hadir'|'terlambat'|'izin'|'sakit'|'cuti'|'alpa'
  durasiKerjaMenit?: number
  suratIzinUrl?: string

kantor/{kantorId}:
  id, kodeKantor, namaKantor, kategori, koordinat: { lat, lng }, radiusMeter, jamMasukMaksimal, jamPulangMinimal, orgId, isActive

lkh/{userId}_{YYYY-MM-DD}:
  userId, nip, nama, orgId, tanggal
  kegiatan: LKHItem[]
  totalPoinHarian, targetPoinHarian: 300, isTargetTercapai
  status: 'draft'|'submitted'|'approved'|'rejected'
  atasanId, catatanPegawai, catatanAtasan
  approvedBy, approvedByName, approvedAt, rejectedReason
  createdAt, updatedAt

users/{userId}: (semua field UserProfile)
  kantorId?: string, allowedKantorIds?: string[]
  storageUsedBytes: number
  storageLimitBytes: 1073741824 (1 GB)

---

## Struktur Modul Aplikasi

`
src/hooks/
  usePresensi.ts, useLKH.ts, useKantor.ts

src/proxy.ts  - (Pengganti middleware.ts pada Next.js 16+)

src/actions/
  presensi.ts   - recordCheckIn, recordCheckOut, getPresensiToday
  lkh.ts        - saveDraftLKH, submitLKH, approveLKH, rejectLKH
  kantor.ts     - getKantorList, saveKantor, deleteKantor
  izin.ts       - submitIzin, getIzinList, approveIzin, rejectIzin
  lembur.ts     - pengajuanLembur, approveLembur, rejectLembur, checkInLembur, checkOutLembur, getLemburHistory

src/app/(dashboard)/
  presensi/     - Presensi digital swafoto & multi-kantor geofence
  laporan/      - Pengisian LKH harian ASN
  lembur/       - Pengajuan & presensi lembur ASN (BARU)
  pengaturan/   - Manajemen titik kantor & geofencing radius
  approval/     - Approval atasan LKH & lembur (tab switching)
  statistik/    - Rekap dan visualisasi statistik
  kalender/     - Kalender kerja ASN
  izin/         - Pengajuan cuti dan izin
`
---

## Arsitektur Unified Attendance Hub
Sistem presensi tidak boleh terpecah-pecah. Terapkan prinsip berikut:
1. **Single Source of Truth Kehadiran**: Halaman presensi wajib mengecek status hari ini secara komprehensif via `getKehadiranStatusHariIni()` (mencakup status presensi, izin aktif, dan lembur aktif).
2. **Context-Aware UI**: Tampilan presensi berubah otomatis jika user sedang izin/cuti, libur nasional, atau harus check-in lembur.
3. **Bottom Sheet & Tabbed Hub**: Hindari route terpisah untuk Izin dan Lembur. Gunakan Tab UI di dalam `/presensi` dan Bottom Sheet untuk form cepat.
4. **Pola Unified Hub Mutlak**: JANGAN gunakan atau buat rute `/izin` atau `/lembur` terpisah. Seluruh antarmuka terkait presensi (check-in/out, pengajuan izin, pengajuan lembur, dan riwayat 30 hari) berpusat di `/presensi` (dengan parameter `?tab=absensi|izin|lembur|riwayat`). Link apapun di navigasi (BottomNav/Sidebar) wajib disesuaikan menuju Hub.
5. **Type-Safety pada Status Kehadiran**: Field `statusKehadiran` yang dikembalikan dari backend wajib menggunakan tipe data bawaan `PresensiStatus | 'belum_absen'` untuk mencegah kegagalan kompilasi (`TS2322`). Komponen UI yang membaca prop ini harus menggunakan *optional chaining* yang tepat (`status={kehadiranStatus?.statusKehadiran}`).

---

## Aturan Ketat Anti-Fraud & Camera
1. **DILARANG REUSE FOTO**: Foto `checkOut` WAJIB berbeda dari foto `checkIn`. Dilarang mengirim `existingFotoUrl` sebagai foto check-out.
2. **DILARANG PLACEHOLDER**: Check-in/out Lembur WAJIB menggunakan komponen `CameraCapture` asli dengan validasi GPS & wajah, bukan placeholder gambar.
3. **Blocking Face Detection**: Komponen kamera harus memblokir (tidak bisa capture) jika wajah tidak terdeteksi (pada browser yang mendukung).

---

## Kebijakan Zero Scattered Mock Data & Single-Source Seed Data

- **Pembersihan Total Mock**:
  - Dilarang keras menaruh mock data array statis di halaman UI (laporan/page.tsx, izin/page.tsx, kalender/page.tsx, page.tsx).
  - Halaman UI wajib me-render data riil dari TanStack Query hooks atau menampilkan Clean Empty State jika data belum tersedia.
- **Single-Source of Truth Seed**:
  - Seluruh data demo resmi dipusatkan di src/data/seedData.ts:
    - SEED_KANTOR: Solo Teknopark Surakarta (STP-01, radius 200m).
    - SEED_USERS: 3 akun ASN resmi (Admin Hendra Wijaya, Atasan Dra. Siti Rahmawati, Pegawai Budi Santoso).
    - SEED_PRESENSI_SAMPLE & SEED_LKH_SAMPLE.
  - Fungsi seedDatabaseAction() pada src/actions/seed.ts dapat dipicu melalui tombol *Reset & Inisialisasi Seed Demo* di halaman Pengaturan untuk menyuntikkan data seed ke database Firestore.

---

## Skema Firestore: Koleksi Lembur (lemburRecords)

```
/lemburRecords/{userId}_{YYYY-MM-DD}
  userId: string
  nip: string
  nama: string
  orgId: string
  tanggal: string          // YYYY-MM-DD
  jenis: 'hari_kerja' | 'hari_libur' | 'hari_raya'
  alasanLembur: string
  jamMulaiRencana: string  // 'HH:mm'
  jamSelesaiRencana: string
  atasanId: string         // WAJIB — ID atasan langsung
  atasanNama: string       // WAJIB — Nama atasan (denormalized)
  status: 'draft' | 'diajukan' | 'disetujui' | 'ditolak' | 'selesai'
  checkInLembur?: PresensiCheckPoint
  checkOutLembur?: PresensiCheckPoint
  durasiLemburMenit?: number
  createdAt: string
  updatedAt: string
```

---

## Aturan Keamanan Server Actions (WAJIB)

1. **SETIAP server action (termasuk fungsi READ) HARUS panggil `await requireAuth()` di baris pertama**
2. **WAJIB Filter Multi-Tenant**: Seluruh query Firestore HARUS memfilter berdasarkan `.where('orgId', '==', sessionUser.orgId)` agar tidak bocor antar instansi.
3. **Dev store fallback WAJIB** — gunakan pola `if (process.env.NODE_ENV === 'development') { ... }` agar tidak crash saat Firebase tidak terkonfigurasi
4. **Filter per atasan**: `getPendingXList()` HARUS filter `item.atasanId === sessionUser.id` jika `role === 'atasan'`
5. **Sync denormalized data**: saat `atasanId` diubah di `updatePegawaiAction`, SELALU resolve dan simpan `atasanNama` sekaligus
6. **Izin Atasan Required**: Payload izin WAJIB menyertakan `atasanId` agar list persetujuan dapat difilter dengan benar oleh atasan.
7. **Cross-Check Izin**: Action check-in reguler WAJIB mengecek apakah user memiliki izin aktif sebelum mengizinkan absensi.

## Pola Filter Approval yang Benar

```typescript
// BENAR: Atasan hanya melihat bawahan langsungnya
const sessionUser = await requireAuth(["atasan", "admin"]);
let list = snap.docs.map(doc => doc.data() as LKHRecord);
if (sessionUser.role === "atasan") {
  list = list.filter(item => item.atasanId === sessionUser.id);
}

// SALAH: Tanpa filter → atasan melihat SEMUA bawahan orgId
// return snap.docs.map(doc => doc.data() as LKHRecord); // ← BUG
```

---

## Seeding Data & Tenant Provisioning
Saat menginisialisasi tenant baru (Organisasi/BLUD/Dinas):
1. **Kantor Unit Wajib Dibuat Pertama**: Selalu buat data di koleksi `kantor` terlebih dahulu (beserta koordinat dan radius).
2. **Relasi User ke Kantor**: Semua user di koleksi `users` **WAJIB** memiliki field `kantorId` dan `namaKantor`. Jangan biarkan kosong, karena sistem Check-In membutuhkan geofence data ini.
3. **Relasi Hirarki Atasan**: Gunakan mekanisme lookup by name atau email untuk memetakan `atasanId` secara presisi dari master data struktur organisasi.
4. **Zero-Trust Login (Non-PNS)**: Untuk login tanpa NIP (contoh: Access Code), jangan ubah Firebase Auth. Firebase Auth HANYA menggunakan email. Buatlah Server Action perantara yang melakukan validasi/translasi (seperti `lookupEmailByAccessCode`) tanpa membuka akses baca Firestore ke publik.

---

## Tabel Data & Mekanisme Filter Architecture
Semua tabel dashboard (seperti Data Pegawai, Riwayat Presensi, LKH) harus menerapkan arsitektur filter hybrid:
- **Backend Filter (Server Actions)**: Eksekusi filtering utama (`kantorId`, `role`, `departmentName`, `search`) di dalam Server Actions (misalnya `PegawaiFilter`). Jangan membuang data besar ke client.
- **Dynamic Dropdown Options**: Untuk dropdown filter seperti "Unit / Subdivisi", fetch satu set query tanpa filter (atau gunakan data default) dan ekstrak nilainya menggunakan `useMemo` dan `Set` di client-side.
- **Semantic UI**: Filter bar harus diletakkan dalam `Card` dengan input pencarian (Search Icon) dan `<select>` native (dikustomisasi dengan Tailwind) berdampingan secara responsif (`flex-col md:flex-row`).

---

## Universal Branding & Terminology (Non-ASN)

Sistem ini dirancang secara universal agar dapat digunakan untuk Swasta, BLUD, ASN, dan pekerja magang. Gunakan terminologi berikut dalam seluruh penamaan UI text, pesan error, label, dan seed data:

- ❌ **Hindari**: ASN, PNS, Pegawai ASN (kecuali untuk maintain legacy variable `asn` yang belum direfactor).
  ✅ **Gunakan**: Pegawai, Karyawan, Personel, atau User.
- ❌ **Hindari**: NIP (secara eksklusif di UI).
  ✅ **Gunakan**: NIP / ID Pegawai, ID Pegawai, atau ID Karyawan.
- ❌ **Hindari**: OPD, Dinas, Instansi Pemerintah (secara eksklusif di UI).
  ✅ **Gunakan**: Unit Kerja, Departemen, atau Divisi.
- ❌ **Hindari**: Hardcode instansi (misal: "Pemerintah Kota Surakarta", "Solo Teknopark").
  ✅ **Gunakan**: Teks dinamis dari data `orgId` / `namaKantor` atau fallback generik seperti "Kantor Pusat / Head Office", "Organisasi".

---

## Arsitektur UI/UX: Mobile-First, Borderless, & Elegan

Aplikasi ini adalah PWA yang wajib terasa seperti **Native Mobile App**. Kita akan merefaktor seluruh UI menuju desain elegan, borderless, dan modern.

Patuhi aturan _styling_ mutlak ini:

1. **Mobile-First Native Feel**: Pastikan area sentuh minimum 44px. Gunakan Bottom Navigation untuk menu utama di layar kecil.
2. **Elegan & Borderless**: JANGAN gunakan *border* tebal/kasar (`border`, `border-gray-300`). Pisahkan elemen menggunakan ruang kosong (*whitespace*), *shadow* super halus (`shadow-sm`, `shadow-black/5`), atau perbedaan warna *background* yang tipis.
3. **Glassmorphism & Soft Radii**: Gunakan efek translusens (`backdrop-blur`) pada Header/Navbar dan *border-radius* yang besar (`rounded-2xl`, `rounded-3xl`) pada Card atau Button.
4. **Micro-Interactions**: Semua interaksi sentuhan/klik (Button, Link, Card hover) WAJIB menggunakan efek transisi halus (`transition-all active:scale-95`). Gunakan Framer Motion untuk transisi perpindahan halaman.
5. **Standarisasi Semantic CSS**: Gunakan kelas semantik di `globals.css` daripada *inline utility string* yang kotor:
   - Layout: `layout-main`
   - Cards: Gunakan `<Card className="card-interactive">` atau `<Card className="card-base">`.
   - Buttons: Gunakan `btn-base` dengan variannya (`btn-primary`, `btn-ghost`, `btn-glass`, dll).
   - Hindari hardcode utility Tailwind berulang untuk komponen utama ini.

---

## Konvensi Next.js 16 (App Router)
1. **Proxy vs Middleware**: File `middleware.ts` tidak lagi didukung dan akan menyebabkan *build fail*. Gunakan `src/proxy.ts`.
2. **Export Function Proxy**: Fungsi wajib dinamakan proxy (`export function proxy(request: NextRequest) { ... }`).

