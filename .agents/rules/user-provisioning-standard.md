# Standar Manajemen Pengguna & Pembuatan Akun ASN (User Provisioning)

## Konteks
Berlaku untuk seluruh sistem kepegawaian ASN di workspace `D:\Project\GAWE\`.
Manajemen akun pengguna mengikat identitas yuridis ASN, hak akses berjenjang (RBAC), serta integritas pelaporan kinerja (LKH) dan presensi berbasis lokasi kantor.

---

## Aturan WAJIB (Mandatory Rules)

### 1. Wewenang & Hak Akses (Role-Based Access Control)
- ❌ DILARANG mengizinkan role `pegawai` atau `atasan` membuat akun baru, mengubah role pengguna lain, atau menghapus pengguna.
- ✅ HANYA pengguna dengan role `admin` (BKPSDM / Administrator Kepegawaian) yang berhak mengakses antarmuka dan Server Actions pembuatan serta manajemen user.
- ✅ Atasan langsung HANYA memiliki hak akses melihat direktori (*read-only*) bagi anggota tim yang berada di bawah unit kerjanya.

### 2. Standar Kelengkapan Parameter Profil ASN
Setiap akun pegawai ASN yang didaftarkan wajib memiliki parameter data kedinasan lengkap:
1. **NIP (Nomor Induk Pegawai)**: 18 digit angka standar BKN (`YYYYMMDD YYYYMM X XXX`).
2. **Nama Lengkap & Gelar**: Nama resmi ASN beserta gelar akademik kedinasan.
3. **Email Kedinasan**: Format email kedinasan instansi resmi (contoh: `@surakarta.go.id`) atau fallback normalisasi NIP (`@asn.go.id`).
4. **Peran Sistem (Role)**: Tepat salah satu dari: `pegawai` (staf pelaksana/fungsional), `atasan` (pejabat penilai kinerja), atau `admin` (pengelola kepegawaian).
5. **Golongan & Pangkat**: Mengacu pada standar ruang BKN (Golongan I/a s.d. IV/e).
6. **Kantor Unit Resmi**: ID dan nama kantor terdaftar di master kantor resmi untuk penentuan titik radius geofencing presensi.
7. **Atasan Langsung**: Wajib ditentukan bagi role `pegawai` agar alur verifikasi LKH harian terarah secara otomatis ke pejabat penilai yang bersangkutan.
8. **Batas Kuota Berkas**: Default 1 GB per ASN untuk penyimpanan bukti swafoto presensi dan lampiran bukti kerja LKH.

### 3. Pola Penyediaan Ganda (Dual-Provisioning Architecture)
- **Lapisan Autentikasi**: Akun didaftarkan ke Firebase Auth menggunakan email kedinasan dan kata sandi awal default yang aman via Firebase Admin SDK (`adminAuth.createUser`).
- **Lapisan Dokumen Profil**: Dokumen profil lengkap disimpan di koleksi Firestore `users/{uid}` dengan ID dokumen yang identik dengan UID Firebase Auth pengguna.
- **Ketahanan Mode Dev (Dev Resilience)**: Di mode development (`NODE_ENV === 'development'`), jika kredensial admin SDK Firebase belum dipasang, pembuatan user tetap mencatat ke pool memori dev lokal sehingga user baru dapat langsung diuji coba login seketika.
