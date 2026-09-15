# 🤖 Agent Instructions — Presensi ASN

## Konteks Proyek
Kamu adalah AI assistant yang membantu pengembangan **Sistem Presensi dan Laporan Kegiatan Harian (LKH) Pegawai ASN**. Aplikasi ini dibangun untuk instansi pemerintah daerah Indonesia.

## Domain Knowledge
- **ASN** = Aparatur Sipil Negara (Pegawai Negeri Sipil Indonesia)
- **LKH** = Laporan Kegiatan Harian — dokumen formal yang wajib diisi ASN setiap hari
- **SKP** = Sasaran Kinerja Pegawai — target kinerja tahunan yang terhubung ke LKH
- **PP 30/2019** = regulasi penilaian kinerja ASN yang menjadi acuan sistem ini
- Presensi ASN diatur ketat: jam masuk 07:30, jam pulang 16:00 (bervariasi per daerah)

## Behavior Agent
1. **Selalu gunakan Bahasa Indonesia** untuk penjelasan, komentar kode, dan pesan error user
2. **Kode tetap dalam Bahasa Inggris** (nama variabel, fungsi, komponen)
3. Prioritaskan **keamanan data ASN** — data presensi bersifat sensitif
4. Selalu tanya klarifikasi jika ada ambiguitas soal bisnis proses (approval flow, hak akses, dll.)
5. Saat generate komponen baru, selalu ikuti pattern yang sudah ada di codebase
6. Gunakan **shadcn/ui** sebagai first choice komponen, jangan membuat komponen custom dari scratch jika shadcn sudah ada

## Tech Stack Cepat
| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Auth | Firebase Auth |
| Database | Firestore |
| Storage | Firebase Storage |
| Styling | Tailwind CSS + shadcn/ui |
| State | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Export | jspdf + xlsx |
| Language | TypeScript |
| Package | pnpm |

## Prioritas Saat Debug
1. Cek Firestore Security Rules terlebih dahulu jika ada error permission
2. Cek tipe TypeScript — jangan suppress error dengan `any`
3. Cek apakah komponen perlu `"use client"` atau bisa tetap Server Component
4. Cek environment variables di `.env.local`

## File Penting
- `src/lib/firebase/config.ts` — Firebase initialization
- `src/lib/firebase/admin.ts` — Firebase Admin SDK (server-only)
- `src/types/index.ts` — Semua TypeScript types
- `firestore.rules` — Firestore security rules
- `storage.rules` — Storage security rules

---

## Konteks Development Saat Ini (Audit September 2026)

**Status Phase**: `Demo/Mock → Production Hydration`

### Yang SUDAH JADI (jangan ubah polanya)
- ✅ Semua UI halaman: login, dashboard, presensi, laporan, profil
- ✅ TypeScript types lengkap di `src/types/index.ts`
- ✅ 152 Master Aktivitas di `src/data/masterAktivitas.ts`
- ✅ Auth context pattern di `src/lib/auth-context.tsx`
- ✅ Multi-role: pegawai, atasan, admin
- ✅ shadcn/ui + Tailwind design system

### Yang BELUM JADI (prioritas pengerjaan)
1. 🔴 Firebase Auth real (`signInWithEmailAndPassword`)
2. 🔴 Firestore hooks untuk presensi & LKH (data masih `useState` lokal)
3. 🔴 Firebase Storage upload nyata (foto selfie/dokumen masih dummy URL)
4. 🟡 Halaman `/kalender` — Kalender presensi bulanan
5. 🟡 Halaman `/atasan` — Dashboard approval LKH
6. 🟡 Halaman `/admin` — Admin panel manajemen pegawai
7. 🟡 Halaman `/izin` — Pengajuan izin/cuti digital

---

## Mapping Halaman & Role

| Halaman | Role yang Bisa Akses | Status |
|---------|---------------------|--------|
| `/login` | Semua | ✅ Ada, perlu Firebase Auth nyata |
| `/` (dashboard) | Semua | ✅ Ada, perlu data real Firestore |
| `/presensi` | pegawai | ✅ Ada, perlu GPS + Storage |
| `/laporan` | pegawai | ✅ Ada, perlu Firestore persistence |
| `/profil` | Semua | ✅ Ada |
| `/kalender` | Semua | ❌ Belum ada |
| `/atasan` | atasan, admin | ❌ Belum ada |
| `/admin` | admin | ❌ Belum ada |
| `/izin` | pegawai | ❌ Belum ada |

---

## Aturan Wajib Saat Generate Kode Baru

1. **Cek types dulu** — Selalu periksa `src/types/index.ts` sebelum membuat interface baru
2. **Gunakan `useAuth()`** — Akses user dari `@/lib/auth-context`, bukan props
3. **Pisahkan komponen** — Komponen domain baru → `src/components/<domain>/NamaKomponen.tsx`
4. **Hooks untuk read** — Data dari Firestore → `src/hooks/use<Nama>.ts` (TanStack Query)
5. **Actions untuk write** — Write ke Firestore → `src/actions/<domain>.ts` (Server Actions)
6. **Selalu ada loading state** — Setiap fetch wajib ada `isLoading` dan skeleton placeholder
7. **Selalu ada error state** — Wajib handle error dengan pesan user-friendly Bahasa Indonesia
8. **Jangan hardcode data demo** — Hapus/replace mock data saat mengintegrasikan Firestore

---

## Rencana Visioner Jangka Panjang

| Tier | Fitur | Timeline |
|------|-------|----------|
| Tier 1 | Firebase Auth real, Firestore hooks, Storage upload | Sprint 1-2 |
| Tier 2 | Dashboard Atasan/Admin, Kalender, Izin/Cuti | Sprint 3-4 |
| Tier 3 | Export PDF/Excel, PWA, Notifikasi, Dark Mode | Sprint 5-6 |
| Tier 4 | Integrasi SKP, AI Logbook, QR Code, Multi-instansi SaaS | Q1 2027+ |

