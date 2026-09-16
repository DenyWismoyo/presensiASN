# Aturan Anti-Simulasi & Anti-Fallback untuk Sistem ASN GAWE

## Konteks
Berlaku untuk semua proyek di workspace ini (`D:\Project\GAWE\`).
Sistem ini adalah aplikasi production untuk pegawai ASN Pemerintah Kota Surakarta.
Data presensi, LKH, dan izin adalah data resmi yang memiliki dampak hukum dan administratif.

---

## Aturan WAJIB (Tidak Boleh Dilanggar)

### 1. Tidak Ada Kode Simulasi di Production UI
- ❌ DILARANG membuat atau mempertahankan fungsi `handleSimulasi*()` di komponen UI production
- ❌ DILARANG membuat tombol/button yang memalsukan data (lokasi, foto, upload file)
- ❌ DILARANG menggunakan URL Unsplash/placeholder sebagai pengganti data nyata dari Firebase Storage
- ❌ DILARANG menggunakan koordinat hardcoded sebagai pengganti GPS nyata

### 2. Tidak Ada In-Memory Fallback Store
- ❌ DILARANG membuat `devXxxStore = new Map()` di server actions
- ❌ DILARANG return `{ success: true }` dengan data palsu jika Firebase gagal
- ✅ Jika Firebase gagal → return `{ success: false, message: "Gagal terhubung ke server" }`
- ✅ In-memory store HANYA boleh di file test (`*.test.ts`, `*.spec.ts`)

### 3. Tidak Ada Auth Fallback ke Demo User
- ❌ DILARANG set `user = DEMO_USERS.xxx` jika Firebase Auth gagal
- ❌ DILARANG `switchRole()` function di auth context production
- ❌ DILARANG bypass auth check jika Firebase tidak tersedia
- ✅ Jika Firebase Auth tidak tersedia → throw error, tampilkan ke user

### 4. Firebase Admin HARUS Real Credential
- ❌ Jika `FIREBASE_ADMIN_PRIVATE_KEY` berisi `MOCK_KEY` → flagging sebagai KRITIS #1
- ✅ Harus diganti dengan private key asli dari Firebase Console → Service Accounts
- ✅ admin.ts harus `fail fast` (throw error) jika credential tidak valid

### 5. Kamera dan Upload HARUS Nyata
- ❌ DILARANG menggunakan `fotoUrl = "https://images.unsplash.com/..."` untuk presensi
- ✅ Foto presensi HARUS dari `getUserMedia()` atau `<input capture="user">`
- ✅ Upload file HARUS melalui `uploadAsnFile()` ke Firebase Storage nyata
- ✅ URL yang tersimpan di Firestore HARUS berupa Firebase Storage `downloadURL`

### 6. GPS HARUS Real (Tidak Ada Koordinat Hardcoded untuk Check-In)
- ❌ DILARANG fallback ke koordinat Solo Teknopark jika GPS gagal
- ✅ GPS gagal → tampilkan error yang jelas, blokir check-in
- ✅ `gpsStatus === "simulated"` HARUS memblokir check-in (bukan sekadar badge)

---

## Pengecualian yang Diizinkan

- ✅ `seedData.ts` — data inisialisasi untuk setup awal database (bukan untuk runtime)
- ✅ `*.test.ts` / `*.spec.ts` — mock/simulasi untuk unit test
- ✅ Quick-login dev di halaman login — HANYA jika `process.env.NODE_ENV === 'development'`
- ✅ `DEFAULT_KANTOR_LIST` di `kantor.ts` — fallback jika Firestore kosong (bukan error)

---

## Checklist saat Audit Kode

Sebelum menyatakan kode "production ready", verifikasi:
- [ ] Tidak ada `devXxxStore = new Map()` di server actions
- [ ] Tidak ada URL Unsplash hardcoded di komponen presensi/LKH
- [ ] Tidak ada `handleSimulasi*()` di UI production
- [ ] `FIREBASE_ADMIN_PRIVATE_KEY` tidak mengandung `MOCK_KEY`
- [ ] Auth context tidak menggunakan default user tanpa Firebase Auth
- [ ] Route dashboard dilindungi middleware atau auth guard
- [ ] Foto presensi diambil dari kamera nyata (bukan URL placeholder)
- [ ] Upload file menggunakan Firebase Storage (bukan URL `"#"` atau Unsplash)
