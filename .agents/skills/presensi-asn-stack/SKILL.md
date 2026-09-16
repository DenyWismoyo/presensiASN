---
name: presensi-asn-stack
description: Cheatsheet lengkap stack, pola Firestore, dan konvensi kode untuk project Presensi & LKH ASN. Gunakan saat membuat fitur baru, debugging, atau integrasi Firebase.
---

# Stack Cheatsheet - Sistem Presensi & LKH ASN

## Tech Stack Resmi Proyek

| Layer | Library | Catatan |
|-------|---------|---------|
| Framework | Next.js 14+ (App Router) | WAJIB App Router, bukan Pages Router |
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
      const ref = doc(db, 'presensiRecords', ${userId}_)
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

Semua operasi WRITE ke Firestore wajib via Server Actions di src/actions/.

`	ypescript
// src/actions/presensi.ts
'use server'
import { adminDb } from '@/lib/firebase/admin'
import { PresensiCheckPoint } from '@/types'

export async function checkInAction(userId: string, orgId: string, data: PresensiCheckPoint) {
  const tanggal = new Date().toISOString().split('T')[0]
  const docId = ${userId}_
  await adminDb.collection('presensiRecords').doc(docId).set(
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

presensiRecords/{userId}_{YYYY-MM-DD}:
  userId, nip, nama, orgId, tanggal
  kantorId?: string, namaKantor?: string
  checkIn?: { waktu, koordinat: {lat,lng}, fotoUrl, isValidLocation, kantorId, namaKantor, jarakMeter }
  checkOut?: { ... same }
  status: 'hadir'|'terlambat'|'izin'|'sakit'|'cuti'|'alpa'
  durasiKerjaMenit?: number
  suratIzinUrl?: string

kantor/{kantorId}:
  id, kodeKantor, namaKantor, kategori, koordinat: { lat, lng }, radiusMeter, jamMasukMaksimal, jamPulangMinimal, orgId, isActive

lkhRecords/{userId}_{YYYY-MM-DD}:
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

src/actions/
  presensi.ts   - recordCheckIn, recordCheckOut, getPresensiToday
  lkh.ts        - saveDraftLKH, submitLKH, approveLKH, rejectLKH
  kantor.ts     - getKantorList, saveKantor, deleteKantor
  izin.ts       - submitIzin, approveIzin

src/app/(dashboard)/
  presensi/     - Presensi digital swafoto & multi-kantor geofence
  laporan/      - Pengisian LKH harian ASN
  pengaturan/   - Manajemen titik kantor & geofencing radius
  approval/     - Approval atasan LKH & presensi
  statistik/    - Rekap dan visualisasi statistik
  kalender/     - Kalender kerja ASN
  izin/         - Pengajuan cuti dan izin
`