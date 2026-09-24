# Aturan Pengembangan UI: Tailwind v4 (Mobile & Desktop Architecture)

1. **Tailwind v4 `@apply` Restrictions:**
   - JANGAN pernah menggunakan nested `@apply` untuk custom class yang didefinisikan sendiri di dalam file CSS (contoh: `@apply card-base` di dalam deklarasi `.card-interactive`).
   - Tailwind v4 hanya mengizinkan `@apply` untuk native utility class (seperti `bg-red-500`, `flex`, dll). Jika ada gaya dasar yang berulang, jabarkan native utility-nya secara eksplisit di setiap custom class.

2. **Mobile Edge-to-Edge Design (Borderless):**
   - Halaman fungsional seperti Presensi, LKH, Izin, dan Lembur HARUS berdesain *edge-to-edge* pada tampilan layar kecil (ponsel).
   - Pastikan container utama tidak memiliki padding horizontal di mobile (misal: gunakan `p-0 sm:p-4 md:p-6` alih-alih hanya `p-4`).
   - Komponen kontainer utama (seperti `.card-base`) di mobile harus tanpa border horizontal dan radius (misal: `border-x-0 rounded-none sm:border sm:border-x sm:rounded-3xl`).

3. **CSS as Source of Truth (Desktop & Global UI):**
   - Hindari *hardcoding* warna spesifik (seperti `bg-slate-900`, `text-emerald-500`) langsung di file komponen `.tsx` utama seperti Sidebar atau Header.
   - Ekstrak kelompok desain yang kompleks (terutama komponen layout Desktop seperti Sidebar, Navigasi) ke dalam `@layer components` di `globals.css` (contoh: `.sidebar-base`, `.sidebar-nav-item`, dll).
   - Selalu gunakan semantic variable Tailwind yang dipetakan dengan tema aplikasi (`bg-background`, `bg-card`, `bg-popover`, `text-primary`, `text-foreground`, dll) agar komponen otomatis beradaptasi dengan *Light/Dark Mode* dan branding warna terpusat.
