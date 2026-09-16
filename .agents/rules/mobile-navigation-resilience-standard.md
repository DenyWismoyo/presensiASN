# Standar Navigasi Ponsel Penuh & Ketahanan Lapangan ASN

## Konteks
Berlaku untuk seluruh aplikasi dan modul di workspace `D:\Project\GAWE\`.

---

## 1. Prinsip "Zero Hidden Routes" pada Tampilan Ponsel
- Seluruh modul aplikasi yang tersedia di Sidebar Desktop **WAJIB** dapat diakses pada perangkat ponsel.
- Di samping 5 menu utama pada Bottom Navigation, sediakan Mobile Drawer / Slide-Over Sheet ("Semua Menu") yang dapat dibuka melalui tombol hamburger di Header ponsel.
- Menu pada drawer harus disaring otomatis sesuai peran pengguna (Admin, Atasan, Pegawai).

---

## 2. Navigasi Mundur Kontekstual (Contextual Back Navigation)
- Setiap halaman sub-fitur (halaman selain Beranda) **WAJIB** menyediakan navigasi atas pada tampilan ponsel yang memuat:
  - Tombol aksi *"Kembali ke Beranda"* (Back button)
  - Judul halaman dan ringkasan fungsi
  - Breadcrumb atau indikator posisi modul

---

## 3. Sentinel Status Jaringan (Network Offline/Online Sentinel)
- Aplikasi **WAJIB** memantau status konektivitas perangkat (`navigator.onLine`).
- Tampilkan banner peringatan ramah di bagian atas layar saat perangkat kehilangan sinyal internet (Offline Mode).
- Berikan notifikasi pemulihan saat koneksi internet kembali aktif secara otomatis tanpa perlu refresh manual.

---

## 4. Umpan Balik Sensorik Multimodal (Audio-Haptic Feedback)
- Setiap aksi presensi masuk, presensi pulang, atau pengiriman berkas LKH **WAJIB** memicu:
  - Haptic feedback (pola getaran: `[40, 60, 40]` ms pada peramban ponsel yang mendukung)
  - Nada konfirmasi harmonis (Web Audio API oscillator, tanpa beban file aset audio eksternal)
- Umpan balik ini krusial untuk memastikan pegawai di area luar ruangan (sinar matahari terik) mengetahui status keberhasilan presensinya tanpa harus menatap layar secara intens.
