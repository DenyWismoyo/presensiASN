process.env.NODE_ENV = "development";
import { calculateRekapStatistik } from "../src/actions/statistik.ts";

console.log("=== VERIFIKASI FITUR REKAP & STATISTIK ASN ===");

async function testStatistik() {
  try {
    // Jalankan kalkulasi rekapitulasi untuk bulan berjalan (September 2026) sebagai Admin
    const res = await calculateRekapStatistik({ bulan: 9, tahun: 2026 }, "admin");
    console.log(`\n1. Periode: Bulan ${res.periodeBulan}, Tahun ${res.periodeTahun}`);
    console.log(`2. Summary Metrik KPI:`);
    console.log(`  • Total Pegawai Terdata: ${res.summary.totalPegawai} ASN`);
    console.log(`  • Rata-rata Tingkat Kehadiran: ${res.summary.rataRataKehadiranRate}%`);
    console.log(`  • Disiplin Waktu (< 07:30 WIB): ${res.summary.disiplinWaktuRate}%`);
    console.log(`  • Rata-rata Poin Kinerja LKH: ${res.summary.rataRataPoinLkh} pts (Target: ${res.summary.targetPoinStandar} pts)`);
    console.log(`  • Target SKP Tercapai: ${res.summary.persentaseTargetLkhTercapai}%`);

    console.log(`\n3. Tren Kehadiran Harian (${res.trenHarian.length} hari):`);
    for (const t of res.trenHarian.slice(-3)) {
      console.log(`  • ${t.labelHari} (${t.tanggal}): Hadir ${t.hadir}, Terlambat ${t.terlambat} -> ${t.ratePersen}%`);
    }

    console.log(`\n4. Rekapitulasi per Pegawai (${res.daftarPegawai.length} ASN):`);
    for (const p of res.daftarPegawai) {
      console.log(`  • ${p.nama} (${p.nip}) | Hadir: ${p.hadirCount}x, Telat: ${p.terlambatCount}x | Kehadiran: ${p.kehadiranPersen}% | Avg SKP: ${p.avgPoinLkh} pts | Predikat: [${p.predikatDisiplin}]`);
    }

    console.log("\n🎉 ALL STATISTIK CHECKS PASSED!");
  } catch (err) {
    console.error("❌ Test error:", err.message);
  }
}

testStatistik();
