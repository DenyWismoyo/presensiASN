# Standar Integrasi Peta Geofencing Leaflet di Next.js App Router

## Konteks
Berlaku untuk semua modul pemetaan kantor, presensi mobile, dan geofencing di workspace `D:\Project\GAWE\`.

---

## 1. Penanganan SSR (`window is not defined`)
- Pustaka `leaflet` mengakses objek browser (`window`, `document`) saat evaluasi modul.
- **Wajib:** Selalu muat komponen Leaflet secara dinamis menggunakan `next/dynamic` dengan opsi `{ ssr: false }`.
  ```tsx
  import dynamic from "next/dynamic";

  const OfficeLocationPicker = dynamic(
    () => import("@/components/maps/OfficeLocationPicker").then((mod) => mod.OfficeLocationPicker),
    { ssr: false, loading: () => <MapSkeleton /> }
  );
  ```
- **Dilarang:** Mengimpor `leaflet` secara statis di tingkat atas Server Component atau Client Component tanpa *SSR guard*.

---

## 2. Penanganan Marker Icon (Asset 404 Prevention)
- Marker default Leaflet (`marker-icon.png`, `marker-shadow.png`) sering gagal dimuat (404) karena resolver asset Turbopack/Webpack.
- **Wajib:** Gunakan `L.divIcon` berbasis inline SVG dengan styling CSS Tailwind.
  - Ringan, tajam di layar Retina/HiDPI, dan tidak bergantung pada path file eksternal.
  ```ts
  const customPinIcon = L.divIcon({
    className: "custom-leaflet-marker",
    html: `<div style="transform: translate(-50%, -100%);">...<svg>...</svg></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
  ```

---

## 3. Reaktivitas Visual Geofence & Sinkronisasi Dua Arah
- Lingkaran geofence (`L.circle`) harus terikat langsung secara reaktif dengan perubahan radius meter (`radiusMeter`).
- Saat slider radius digeser: lingkaran peta harus otomatis membesar/mengecil secara *real-time*.
- Saat pin digeser (*dragged*) atau peta diklik: nilai input Latitude dan Longitude harus langsung terupdate, dan sebaliknya (ketika angka diketik, pin dan lingkaran otomatis bergeser).
- Sediakan tombol pintas *"Gunakan Lokasi Saya"* yang memanfaatkan Geolocation API browser untuk akurasi instan saat penentuan titik baru.

---

## 4. Efisiensi & Kinerja
- Gunakan OpenStreetMap tile server (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`) dengan atribusi resmi.
- Panggil `map.invalidateSize()` di dalam `setTimeout` atau `useEffect` saat container peta pertama kali dirender atau di-resize untuk mencegah visual peta terpotong (*gray tiles*).
