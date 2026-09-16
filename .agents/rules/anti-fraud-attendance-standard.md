# Standar Integritas & Anti-Fraud Sistem Presensi ASN

## Konteks
Berlaku untuk semua proyek di workspace `D:\Project\GAWE\` (khususnya PresensiASN dan ekosistem ASN Pemerintah Kota Surakarta).

## Aturan Wajib Anti-Fraud

### 1. Prinsip "Zero-Trust Client" untuk Geofencing
- Server **DILARANG** mempercayai `isValidLocation` atau `jarakMeter` yang dikirimkan oleh browser/klien.
- Server Action **WAJIB** mengambil koordinat kantor resmi dari database Firestore/Master Kantor dan menghitung ulang jarak Haversine di sisi server (`serverDistance`).
- Jika `serverDistance > kantor.radiusMeter`, server **WAJIB** menolak presensi dengan status error yang jelas (`FRAUD_REJECTED`).

### 2. Stempel Forensik Digital (Visual Watermark) pada Swafoto
- Setiap swafoto presensi **WAJIB** dicap (*burn-in*) langsung ke dalam pixel array canvas sebelum diunggah ke Firebase Storage:
  - Header: Identitas Resmi Pemerintah Kota Surakarta • Presensi ASN
  - NIP & Nama Lengkap Pegawai
  - Tanggal & Waktu Realtime (format ISO / WIB)
  - Koordinat GPS (Latitude, Longitude)
  - Nama Unit Kerja / Kantor Terdeteksi
- Stempel ini menjadi bukti forensik visual yang tidak dapat dipalsukan atau dihilangkan setelah tersimpan di cloud storage.

### 3. Validasi Integritas Swafoto (Anti-Cover Lens)
- Sebelum foto diunggah, canvas **WAJIB** dianalisis tingkat kecerahan rata-ratanya (*average luminosity*):
  - Jika piksel terlalu gelap (luminosity < 20), sistem wajib menolak karena ada indikasi lensa sengaja ditutup atau ruangan terlalu gelap.
  - Jika piksel terlalu terang/putih pekat (luminosity > 245), sistem wajib menolak karena silau/kamera tertutup cahaya buatan.
- Manfaatkan native `FaceDetector` API (jika didukung browser/Chromium) untuk memverifikasi keberadaan wajah manusia di kamera.

### 4. Deteksi GPS Mocking & Integritas Satelit
- Browser/Client **WAJIB** memeriksa `coords.accuracy`. Jika akurasi > 200 meter (hanya sinyal BTS/Wi-Fi kasar) atau bernilai 0 (anomali emulator), beri peringatan bahwa sinyal GPS tidak memadai.
- Periksa atribut `(coords as any).isMock` atau `mocked` untuk mendeteksi dan memblokir aplikasi fake GPS di perangkat mobile.

### 5. Jejak Audit Forensik Lengkap (Audit Trail)
- Setiap transaksi presensi masuk (*check-in*) dan pulang (*check-out*) **WAJIB** mencatat:
  - IP Address pengguna (dari header `x-forwarded-for` / `x-real-ip`)
  - User-Agent lengkap perangkat / browser
  - Waktu server resmi (`new Date()`, bukan jam perangkat pengguna)
  - Jarak meter terverifikasi oleh server (`serverVerifiedDistanceMeter`)
