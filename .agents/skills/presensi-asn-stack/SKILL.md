---
name: presensi-asn-stack
description: Cheatsheet lengkap stack, pola Firestore, dan konvensi kode untuk project Presensi & LKH ASN. Gunakan saat membuat fitur baru, debugging, atau integrasi Firebase.
---

# Stack Cheatsheet — Sistem Presensi & LKH ASN

## Tech Stack Resmi Proyek

| Layer | Library | Catatan |
|-------|---------|---------|
| Framework | Next.js 14+ (App Router) | WAJIB App Router, bukan Pages Router |
| Auth | Firebase Auth v10 | signInWithEmailAndPassword |
| Database | Firestore v10 | real-time, offline support |
| Storage | Firebase Storage v10 | path: `{orgId}/{userId}/{year}/{month}/` |
| Styling | Tailwind CSS v3 + shadcn/ui | utility-first, jangan custom dari scratch |
| Server State | TanStack Query v5 | semua Firestore read pakai ini |
| Forms | React Hook Form + Zod | type-safe validation |
| Charts | Recharts v2 | presensi stat, kinerja grafik |
| Export | jspdf + xlsx | format laporan resmi instansi |
| Icons | lucide-react | sudah include di shadcn/ui |
| Package | pnpm | jangan npm/yarn |
| Language | TypeScript | wajib, jangan `any` |

---

## Pola Standar: Custom Hook Firestore (Read)

Semua data fetching ke Firestore WAJIB menggunakan custom hook di `src/hooks/`.

```typescript
// src/hooks/usePresensiHarian.ts
import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { PresensiRecord } from '@/types'

export function usePresensiHarian(userId: string, tanggal: string) {
  return useQuery({
    queryKey: ['presensi', userId, tanggal],
    queryFn: async () => {
      const ref = doc(db, 'presensiRecords', `${userId}_${tanggal}`)
      const snap = await getDoc(ref)
      return snap.exists() ? (snap.data() as PresensiRecord) : null
    },
    enabled: !!userId && !!tanggal,
    staleTime: 1000 * 60 * 5,
  })
}
```

queryKey conventions:
- `['presensi', userId, tanggal]` — 1 record presensi hari ini
- `['presensi-histori', userId, bulan]` — rekap bulanan
- `['lkh', userId, tanggal]` — LKH hari ini
- `['lkh-pending', atasanId]` — list untuk approval atasan
- `['rekap-instansi', orgId, bulan]` — rekap admin
- `['user-profile', userId]` — profil + storage usage

---

## Pola Standar: Server Action (Write ke Firestore)

Semua operasi WRITE ke Firestore wajib via Server Actions di `src/actions/`.

```typescript
// src/actions/presensi.ts
'use server'
import { adminDb } from '@/lib/firebase/admin'
import { PresensiCheckPoint } from '@/types'

export async function checkInAction(userId: string, orgId: string, data: PresensiCheckPoint) {
  const tanggal = new Date().toISOString().split('T')[0]
  const docId = `${userId}_${tanggal}`
  await adminDb.collection('presensiRecords').doc(docId).set(
    { userId, orgId, tanggal, checkIn: data, status: 'hadir', updatedAt: new Date().toISOString() },
    { merge: true }
  )
  return { success: true, docId }
}
```

```typescript
// src/actions/lkh.ts
'use server'
export async function approveLKHAction(lkhId: string, atasanId: string, atasanNama: string, catatan?: string) {
  await adminDb.collection('lkhRecords').doc(lkhId).update({
    status: 'approved',
    approvedBy: atasanId,
    approvedByName: atasanNama,
    catatanAtasan: catatan || '',
    approvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}
```

---

## Pola Standar: Upload Firebase Storage

```typescript
// src/lib/firebase/storage-helpers.ts
// Path convention: {orgId}/{userId}/{year}/{month}/{subdomain}/{filename}
export async function uploadFotoPresensi(userId: string, orgId: string, blob: Blob, type: 'checkin' | 'checkout'): Promise<string> {
  const now = new Date()
  const path = `${orgId}/${userId}/${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/presensi/${type}_${Date.now()}.jpg`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
  return getDownloadURL(storageRef)
}
```

---

## Firestore Collection Schema

presensiRecords/{userId}_{YYYY-MM-DD}:
  userId, nip, nama, orgId, tanggal
  checkIn?: { waktu, koordinat: {lat,lng}, fotoUrl, isValidLocation }
  checkOut?: { ... same }
  status: 'hadir'|'terlambat'|'izin'|'sakit'|'cuti'|'alpa'
  durasiKerjaMenit?: number
  suratIzinUrl?: string

lkhRecords/{userId}_{YYYY-MM-DD}:
  userId, nip, nama, orgId, tanggal
  kegiatan: LKHItem[]
  totalPoinHarian, targetPoinHarian: 300, isTargetTercapai
  status: 'draft'|'submitted'|'approved'|'rejected'
  atasanId, catatanPegawai, catatanAtasan
  approvedBy, approvedByName, approvedAt, rejectedReason
  createdAt, updatedAt

users/{userId}: (semua field UserProfile)
  storageUsedBytes: number
  storageLimitBytes: 1073741824 (1 GB)

organizations/{orgId}:
  namaInstansi, alamat
  koordinatKantor: { lat, lng }
  radiusMeter: 150
  jamMasukMaksimal: '07:30', jamPulangMinimal: '16:00'
  hariKerja: string[]

---

## Pola Firebase Auth (Penggantian Mock)

```typescript
// src/lib/firebase/auth-helpers.ts
// NIP ? email: "19920817 201801 1 002" ? "199208172018011002@asn.go.id"
export function nipToEmail(nip: string): string {
  return `${nip.replace(/\s/g, '')}@asn.go.id`
}

export async function loginASN(nipOrEmail: string, password: string) {
  const email = nipOrEmail.includes('@') ? nipOrEmail : nipToEmail(nipOrEmail)
  return signInWithEmailAndPassword(auth, email, password)
}
```

---

## shadcn/ui Components yang Sudah Ada

Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter
Button (variant: default|outline|ghost|destructive|secondary)
Badge (variant: default|secondary|outline|warning|info|destructive)
Input, Label, Avatar, Skeleton (untuk loading state)

---

## Ikon lucide-react Domain

Presensi: Clock, ClockCheck, MapPin, Camera, Navigation, History, ShieldCheck
LKH: FileSpreadsheet, FileText, CheckCheck, BookOpen, FolderArchive, UploadCloud
Status: CheckCircle2, AlertCircle, AlertTriangle, XCircle, Sparkles, Zap
Storage: HardDrive, Trash2, Image (as ImageIcon)
User: UserCheck2, ShieldAlert, Award, Building, Building2, IdCard
Nav: ArrowUpRight, ArrowRight, ChevronDown, Plus, Send

---

## Color Palette Proyek

Primer    : emerald-600 / emerald-700 / emerald-800
Sekunder  : teal-600 / teal-700
Background: slate-50 (card) / slate-900 (dark)
Border    : slate-200 / slate-700
Warning   : amber-500
Error     : red-600

---

## Firestore Security Rules Prinsip

presensiRecords: pegawai create untuk diri sendiri; admin update semua
lkhRecords: pegawai CRUD draft milik sendiri; atasan approve/reject
users: admin write; user read/update profil sendiri

---

## Struktur Target yang Harus Dibuat

```
src/hooks/
  usePresensiHarian.ts, usePresensiHistori.ts
  useLKHHarian.ts, useLKHPending.ts
  useUserProfile.ts, useRekapBulanan.ts, useOfficeConfig.ts

src/actions/
  presensi.ts   — checkInAction, checkOutAction, inputIzinAction
  lkh.ts        — saveDraftLKH, submitLKH, approveLKH, rejectLKH
  storage.ts    — uploadFoto, uploadDokumen, hapusBerkas
  user.ts       — updateProfil, updateStorageUsed

src/app/(dashboard)/
  kalender/     — Kalender presensi bulanan visual
  atasan/       — Dashboard approval LKH atasan
  admin/        — Admin panel CRUD pegawai
  izin/         — Form pengajuan izin/cuti
```
