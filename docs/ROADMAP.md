# 🗺️ Roadmap Pengembangan — Sistem Presensi ASN & Laporan Kegiatan Harian

> **Versi**: 1.0  
> **Terakhir diperbarui**: September 2026  
> **Target**: Instansi pemerintah daerah Indonesia  
> **Stack**: Next.js 14 • Firebase • Tailwind CSS • shadcn/ui • TypeScript

---

## 🎯 Executive Summary

Sistem ini menggabungkan dua kebutuhan utama ASN:
1. **Presensi Digital** — check-in/out berbasis GPS + foto selfie, menggantikan presensi manual/fingerprint
2. **Laporan Kegiatan Harian (LKH)** — sistem upload dan approval laporan harian dengan bukti foto/dokumen

---

## 📦 Phase 1 — Foundation & Auth *(Estimasi: 2–3 minggu)*

### Milestone 1.1 — Setup Project
- [ ] Init project Next.js 14 dengan App Router + TypeScript
- [ ] Setup Tailwind CSS + shadcn/ui (full component install)
- [ ] Setup Firebase project (Auth, Firestore, Storage)
- [ ] Setup environment variables & Firebase config
- [ ] Setup ESLint, Prettier, Husky pre-commit hooks
- [ ] Setup TanStack Query provider
- [ ] Buat Firestore & Storage security rules dasar

### Milestone 1.2 — Auth & User Management
- [ ] Login dengan Email/Password (Firebase Auth)
- [ ] Proteksi route dengan middleware Next.js
- [ ] Halaman login dengan UI premium (shadcn + animasi)
- [ ] Multi-role: Admin, Atasan, Pegawai
- [ ] Profil pegawai (foto, jabatan, NIP, bidang)
- [ ] Manajemen user oleh Admin (CRUD pegawai)
- [ ] Setup hierarki atasan-bawahan

### Deliverable Phase 1
- ✅ Aplikasi bisa diakses dengan login
- ✅ Admin bisa input data pegawai
- ✅ Role-based access berfungsi

---

## 📦 Phase 2 — Modul Presensi *(Estimasi: 3–4 minggu)*

### Milestone 2.1 — Core Presensi
- [ ] Dashboard presensi hari ini
- [ ] Check-in: ambil koordinat GPS otomatis
- [ ] Check-in: capture foto selfie (via kamera browser)
- [ ] Validasi geofencing (radius dari koordinat kantor)
- [ ] Upload foto selfie ke Firebase Storage
- [ ] Deteksi otomatis status: Hadir / Terlambat (berdasarkan jam kerja)
- [ ] Check-out dengan foto & koordinat
- [ ] Hitung durasi kerja otomatis

### Milestone 2.2 — Presensi Management
- [ ] Pegawai bisa input izin/sakit/cuti dengan surat/dokumen
- [ ] Admin bisa verifikasi dan ubah status presensi
- [ ] Kalender presensi bulanan per pegawai
- [ ] Rekap mingguan & bulanan dengan chart (Recharts)
- [ ] Setup hari libur nasional & daerah

### Milestone 2.3 — Reporting Presensi
- [ ] Export rekap presensi per pegawai ke Excel
- [ ] Export rekap seluruh bidang ke Excel/PDF
- [ ] Laporan rekapitulasi instansi (dashboard Admin)
- [ ] Notifikasi reminder presensi (opsional: browser notification)

### Deliverable Phase 2
- ✅ Presensi digital berjalan dengan foto + GPS
- ✅ Admin bisa pantau presensi seluruh pegawai
- ✅ Laporan bisa di-export

---

## 📦 Phase 3 — Modul LKH (Laporan Kegiatan Harian) *(Estimasi: 3–4 minggu)*

### Milestone 3.1 — Form LKH
- [ ] Form pengisian LKH harian dengan multiple kegiatan
- [ ] Field: deskripsi kegiatan, volume, satuan, jam mulai-selesai
- [ ] Auto-save draft setiap perubahan (debounced)
- [ ] Upload foto bukti kegiatan (multi-file, drag & drop)
- [ ] Upload dokumen pendukung (PDF, Word, Excel)
- [ ] Preview dokumen/foto sebelum submit
- [ ] Validasi form lengkap sebelum submit

### Milestone 3.2 — Workflow Approval
- [ ] Submit LKH ke atasan langsung
- [ ] Dashboard atasan: list LKH pending approval
- [ ] Atasan bisa Approve atau Reject dengan catatan
- [ ] Notifikasi in-app saat ada perubahan status
- [ ] Riwayat status perubahan (audit trail)
- [ ] LKH yang di-reject bisa diperbaiki dan resubmit

### Milestone 3.3 — Manajemen LKH
- [ ] Kalender LKH per pegawai (visual status draft/submitted/approved)
- [ ] Filter & search LKH (per pegawai, tanggal, status)
- [ ] Admin bisa lihat semua LKH seluruh instansi
- [ ] Export LKH per bulan ke PDF (format resmi)
- [ ] Rekap persentase pengumpulan LKH per bidang

### Deliverable Phase 3
- ✅ LKH bisa diisi, upload bukti, dan diapprove
- ✅ Workflow approval berjalan
- ✅ Export laporan tersedia

---

## 📦 Phase 4 — Dashboard & Analytics *(Estimasi: 2 minggu)*

### Milestone 4.1 — Dashboard Admin
- [ ] Overview: statistik presensi hari ini (hadir/terlambat/alpa)
- [ ] Grafik tren kehadiran mingguan/bulanan (Recharts)
- [ ] Top/bottom performer kehadiran
- [ ] Status LKH overview (% submitted, approved per bidang)
- [ ] Widget cuaca & jam kerja sisa hari ini

### Milestone 4.2 — Dashboard Pegawai
- [ ] Summary presensi bulan berjalan
- [ ] Status LKH bulan berjalan
- [ ] Quick action: Check-in/Check-out
- [ ] Pengumuman dari Admin
- [ ] Kalender terpadu (presensi + LKH)

### Deliverable Phase 4
- ✅ Dashboard informatif untuk semua role
- ✅ Analytics tersedia

---

## 📦 Phase 5 — Polish & Production Ready *(Estimasi: 2–3 minggu)*

### Milestone 5.1 — UX & Performance
- [ ] Loading skeleton untuk semua halaman
- [ ] Error boundaries & error pages
- [ ] Optimistic updates (TanStack Query)
- [ ] Image optimization (next/image + sharp)
- [ ] PWA support (manifest.json + service worker) untuk mobile
- [ ] Responsive design (mobile-first)
- [ ] Dark mode support

### Milestone 5.2 — Security & Hardening
- [ ] Audit Firestore security rules (semua collection)
- [ ] Audit Storage security rules
- [ ] Rate limiting pada API routes
- [ ] Input sanitization & XSS prevention
- [ ] CSRF protection
- [ ] Logging error ke Firebase Crashlytics / Sentry

### Milestone 5.3 — Deployment
- [ ] Setup Firebase Hosting atau Vercel
- [ ] Setup custom domain
- [ ] Setup monitoring (Firebase Performance Monitoring)
- [ ] Dokumentasi teknis (README, API docs)
- [ ] User guide untuk Admin & Pegawai
- [ ] Training & handover

### Deliverable Phase 5
- ✅ Siap production
- ✅ Aman & performant
- ✅ Dokumentasi lengkap

---

## 🔮 Future Enhancement (Post-Launch)

| Fitur | Prioritas | Estimasi |
|-------|-----------|----------|
| Integrasi SKP (Sasaran Kinerja Pegawai) | Tinggi | 3 minggu |
| Presensi QR Code untuk kantor tanpa GPS | Sedang | 1 minggu |
| Notifikasi Email/WhatsApp (via Twilio/WABA) | Sedang | 2 minggu |
| Mobile App (React Native / Expo) | Tinggi | 8 minggu |
| Integrasi SIMPEG (Sistem Informasi Kepegawaian) | Tinggi | 4 minggu |
| Laporan BKN (format standar nasional) | Tinggi | 2 minggu |
| Multi-instansi / Multi-tenant | Rendah | 4 minggu |
| Fingerprint/Face Recognition (WebAuthn) | Rendah | 3 minggu |

---

## 📊 Timeline Visual

```
2026
Sept    │████ Phase 1: Foundation & Auth
Okt     │     ████████ Phase 2: Presensi
Nov     │              ████████ Phase 3: LKH
Des     │                       ████ Phase 4: Analytics
Jan'27  │                            ████████ Phase 5: Polish & Deploy
```

---

## 🛠️ Tech Stack Detail

| Kategori | Pilihan | Alasan |
|----------|---------|--------|
| Framework | Next.js 14 (App Router) | SSR, caching, performance terbaik |
| Auth | Firebase Auth | Mudah, aman, free tier mencukupi |
| Database | Firestore | Real-time, offline support, scalable |
| Storage | Firebase Storage | Integrasi native dengan Firestore |
| Styling | Tailwind CSS v3 | Utilty-first, cepat, mudah custom |
| Components | shadcn/ui | Accessible, customizable, production-ready |
| State | TanStack Query v5 | Caching, optimistic updates, devtools |
| Forms | React Hook Form + Zod | Performa terbaik, type-safe validation |
| Charts | Recharts | React-native, Tailwind-compatible |
| Export | jspdf + xlsx | Laporan resmi instansi |
| Language | TypeScript | Type safety wajib untuk skala ini |
| Package Manager | pnpm | Cepat, efisien disk space |

---

## 📁 Struktur Repository

```
PresensiASN/
├── .agents/
│   ├── rules/
│   │   └── presensi-asn.md       ← Project rules
│   ├── skills/
│   │   └── presensi-asn-stack/
│   │       └── SKILL.md          ← Stack cheatsheet
│   └── agents/
│       └── AGENTS.md             ← Agent instructions
├── docs/
│   ├── ROADMAP.md                ← File ini
│   ├── data-model.md             ← Dokumentasi Firestore schema
│   ├── api-docs.md               ← Dokumentasi API routes
│   └── user-guide/               ← Panduan pengguna
├── src/                          ← Kode Next.js
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   ├── types/
│   └── actions/
├── firestore.rules
├── storage.rules
├── firebase.json
└── README.md
```

---

## ✅ Definition of Done (Setiap Fitur)

Sebuah fitur dianggap selesai jika:
1. ✅ Fungsi berjalan sesuai requirement
2. ✅ Tipe TypeScript lengkap (tidak ada `any`)
3. ✅ Firestore security rules sudah di-update
4. ✅ Error handling ada (loading state, error state)
5. ✅ Responsive di mobile (min. 375px)
6. ✅ Ditest manual di browser
