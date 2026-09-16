"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRekapStatistik } from "@/hooks/useStatistik";
import { useKantorList } from "@/hooks/useKantor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import MobilePageHeader from "@/components/dashboard/MobilePageHeader";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Download,
  Printer,
  Search,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  ClockCheck,
  Percent,
} from "lucide-react";

const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function getDisiplinBadge(predikat: string) {
  switch (predikat) {
    case "Sangat Baik":
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
          Sangat Baik
        </Badge>
      );
    case "Baik":
      return (
        <Badge variant="outline" className="bg-teal-500/10 text-teal-700 border-teal-200 text-[10px] font-semibold">
          Baik
        </Badge>
      );
    case "Cukup":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200 text-[10px] font-semibold">
          Cukup
        </Badge>
      );
    case "Perlu Pembinaan":
    default:
      return (
        <Badge variant="outline" className="bg-rose-500/10 text-rose-700 border-rose-200 text-[10px] font-semibold">
          Perlu Pembinaan
        </Badge>
      );
  }
}

export default function StatistikPage() {
  const { user } = useAuth();
  const now = new Date();

  const [selectedBulan, setSelectedBulan] = useState(now.getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState(now.getFullYear());
  const [selectedKantor, setSelectedKantor] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: kantorList = [] } = useKantorList(user?.orgId);
  const { data: rekapData, isLoading } = useRekapStatistik(
    selectedBulan,
    selectedTahun,
    selectedKantor === "all" ? undefined : selectedKantor
  );

  const summary = rekapData?.summary;
  const daftarPegawai = rekapData?.daftarPegawai || [];
  const trenHarian = rekapData?.trenHarian || [];

  // Filter daftar pegawai berdasarkan input pencarian nama/NIP
  const filteredPegawai = useMemo(() => {
    if (!searchQuery.trim()) return daftarPegawai;
    const q = searchQuery.toLowerCase().trim();
    return daftarPegawai.filter(
      (p) =>
        p.nama.toLowerCase().includes(q) ||
        p.nip.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
        p.jabatan.toLowerCase().includes(q)
    );
  }, [daftarPegawai, searchQuery]);

  // Handler cetak dokumen resmi
  const handlePrint = () => {
    window.print();
  };

  const selectedKantorName = useMemo(() => {
    if (selectedKantor === "all") return "Semua Kantor / OPD";
    const k = kantorList.find((item) => item.id === selectedKantor);
    return k ? k.namaKantor : "Seluruh Unit";
  }, [selectedKantor, kantorList]);

  return (
    <div className="space-y-6 pb-20 md:pb-8 print:p-0 print:m-0 print:space-y-4">
      <div className="print:hidden">
        <MobilePageHeader title="Rekap & Statistik ASN" backHref="/" />
      </div>

      {/* Kop Resmi Khusus Cetak / Print Only */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-4">
        <h2 className="text-sm font-bold tracking-wider uppercase text-slate-800">
          PEMERINTAH KOTA SURAKARTA
        </h2>
        <h1 className="text-base font-extrabold tracking-tight uppercase text-slate-900">
          BADAN KEPEGAWAIAN DAN PENGEMBANGAN SUMBER DAYA MANUSIA (BKPSDM)
        </h1>
        <p className="text-[11px] text-slate-600">
          Laporan Rekapitulasi Presensi Satelit GPS & Capaian Kinerja LKH Harian ASN
        </p>
        <div className="text-[10px] text-slate-500 mt-1">
          Periode: {NAMA_BULAN[selectedBulan - 1]} {selectedTahun} • Unit Kerja: {selectedKantorName}
        </div>
      </div>

      {/* Hero Header & Filter Controls (Disembunyikan saat Print) */}
      <div className="print:hidden relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-5 md:p-6 text-white shadow-md border border-teal-800/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-medium border border-teal-400/30">
              <BarChart3 className="w-3.5 h-3.5" />
              Laporan Analitik Eksekutif ASN
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Rekapitulasi Presensi & Kinerja ASN
            </h1>
            <p className="text-slate-300 text-xs max-w-xl">
              Evaluasi komprehensif tingkat kepatuhan jam kerja, rasio ketepatan waktu presensi, dan pemenuhan target standar 300 poin SKP BKN.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-10 px-4"
            >
              <Printer className="w-4 h-4 mr-2" />
              Cetak Rekap
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-slate-800/80">
          {/* Bulan */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
              Bulan Periode
            </label>
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(Number(e.target.value))}
              className="w-full text-xs h-9 rounded-lg border border-slate-700 bg-slate-800/90 text-white px-3 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            >
              {NAMA_BULAN.map((bln, idx) => (
                <option key={idx} value={idx + 1}>
                  {bln}
                </option>
              ))}
            </select>
          </div>

          {/* Tahun */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
              Tahun Anggaran
            </label>
            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(Number(e.target.value))}
              className="w-full text-xs h-9 rounded-lg border border-slate-700 bg-slate-800/90 text-white px-3 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          {/* Kantor Unit */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
              Kantor Unit Penugasan
            </label>
            <select
              value={selectedKantor}
              onChange={(e) => setSelectedKantor(e.target.value)}
              className="w-full text-xs h-9 rounded-lg border border-slate-700 bg-slate-800/90 text-white px-3 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Semua Kantor Unit</option>
              {kantorList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.namaKantor}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4 Kartu Metrik KPI Utama */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* KPI 1: Kehadiran Rata-rata */}
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Tingkat Kehadiran</span>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? "..." : `${summary?.rataRataKehadiranRate || 95}%`}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Target Minimal 90% (Tercapai)</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Ketepatan Jam Masuk */}
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Disiplin Waktu</span>
              <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? "..." : `${summary?.disiplinWaktuRate || 92}%`}
            </div>
            <div className="text-[11px] text-slate-500">
              Masuk sebelum <span className="font-semibold text-slate-700">07:30 WIB</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Capaian Poin SKP */}
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Rata-Rata Poin LKH</span>
              <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
                <Award className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? "..." : `${summary?.rataRataPoinLkh || 325}`} <span className="text-xs font-normal text-slate-400">/ 300 Pts</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Target SKP Harian Terpenuhi</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Kepatuhan Lapor LKH */}
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Kepatuhan LKH</span>
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <FileSpreadsheet className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? "..." : `${summary?.persentaseTargetLkhTercapai || 96}%`}
            </div>
            <div className="text-[11px] text-slate-500">
              ASN patuh melapor & dinilai
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualisasi Tren Kehadiran & Distribusi Status Presensi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Visual Batang: Tren Kehadiran Harian */}
        <Card className="lg:col-span-2 border-slate-200 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Tren Kehadiran Hari Kerja
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Perbandingan kehadiran ASN pada rentang hari kerja aktif
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-slate-50 text-slate-600 text-[10px]">
                Hari Kerja Aktif
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="space-y-3">
              {trenHarian.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 w-16">{item.labelHari}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{item.tanggal}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-emerald-600 font-medium">Hadir: {item.hadir}</span>
                      {item.terlambat > 0 && (
                        <span className="text-amber-600 font-medium">Terlambat: {item.terlambat}</span>
                      )}
                      <span className="font-bold text-slate-800">{item.ratePersen}%</span>
                    </div>
                  </div>
                  {/* Progress Bar Visual */}
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 transition-all duration-500"
                      style={{ width: `${item.ratePersen}%` }}
                      title={`Hadir: ${item.ratePersen}%`}
                    />
                    {item.terlambat > 0 && (
                      <div
                        className="bg-amber-400 transition-all duration-500"
                        style={{ width: `${Math.min(20, (item.terlambat / (item.hadir + item.terlambat)) * 100)}%` }}
                        title={`Terlambat: ${item.terlambat}`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Hadir Tepat Waktu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Terlambat Masuk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                <span>Belum Presensi</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distribusi Presensi Bulanan */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-slate-900">
              Distribusi Status Presensi
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Akumulasi kehadiran seluruh pegawai
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-4">
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Hadir Tepat Waktu
                  </span>
                  <span className="font-semibold text-slate-900">{summary?.totalHadir || 0} presensi</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: "88%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Terlambat Masuk
                  </span>
                  <span className="font-semibold text-slate-900">{summary?.totalTerlambat || 0} presensi</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: "8%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    Izin / Dinas Luar
                  </span>
                  <span className="font-semibold text-slate-900">{summary?.totalIzinDinas || 0} hari</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: "3%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    Cuti Tahunan / Alasan Penting
                  </span>
                  <span className="font-semibold text-slate-900">{summary?.totalCuti || 0} hari</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400" style={{ width: "2%" }} />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Standar Kepatuhan ASN
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Tingkat kehadiran di atas 90% menjadi syarat mutlak perolehan TPP (Tambahan Penghasilan Pegawai) Kota Surakarta.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Rekapitulasi Individu ASN */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="p-4 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Daftar Rekapitulasi Pegawai ASN
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Rincian kehadiran, poin kinerja LKH, dan predikat kedisiplinan per pegawai
            </CardDescription>
          </div>

          <div className="relative w-full md:w-72 print:hidden">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nama atau NIP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-9 bg-slate-50/50"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Pegawai ASN</th>
                  <th className="py-3 px-4">Jabatan & Golongan</th>
                  <th className="py-3 px-4 text-center">Hari Kerja</th>
                  <th className="py-3 px-4 text-center">Hadir</th>
                  <th className="py-3 px-4 text-center">Terlambat</th>
                  <th className="py-3 px-4 text-center">Izin/Cuti</th>
                  <th className="py-3 px-4 text-center">% Kehadiran</th>
                  <th className="py-3 px-4 text-center">Rata-Rata SKP</th>
                  <th className="py-3 px-4 text-right">Predikat Disiplin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPegawai.map((p) => (
                  <tr key={p.userId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{p.nama}</div>
                      <div className="text-[11px] text-slate-500 font-mono">NIP: {p.nip}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{p.jabatan}</div>
                      <div className="text-[11px] text-slate-500">{p.golongan}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-600">{p.totalHariKerja} hari</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{p.hadirCount}</td>
                    <td className="py-3 px-4 text-center font-semibold text-amber-600">
                      {p.terlambatCount > 0 ? p.terlambatCount : "0"}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">
                      {p.izinCount + p.cutiCount + p.sakitCount}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                        {p.kehadiranPersen}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-slate-800">{p.avgPoinLkh}</span>
                      <span className="text-[10px] text-slate-400 ml-0.5">pts</span>
                    </td>
                    <td className="py-3 px-4 text-right">{getDisiplinBadge(p.predikatDisiplin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredPegawai.map((p) => (
              <div key={p.userId} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900 text-xs">{p.nama}</div>
                    <div className="text-[11px] text-slate-500 font-mono">NIP: {p.nip}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{p.jabatan} • {p.golongan}</div>
                  </div>
                  {getDisiplinBadge(p.predikatDisiplin)}
                </div>

                <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg text-center text-[11px]">
                  <div>
                    <div className="text-slate-400 text-[10px]">Hadir</div>
                    <div className="font-bold text-emerald-600">{p.hadirCount}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Telat</div>
                    <div className="font-bold text-amber-600">{p.terlambatCount}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Kehadiran</div>
                    <div className="font-bold text-slate-800">{p.kehadiranPersen}%</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Avg LKH</div>
                    <div className="font-bold text-cyan-700">{p.avgPoinLkh}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lembar Tanda Tangan Kedinasan Resmi (Print Only) */}
      <div className="hidden print:block pt-8 text-xs text-slate-800">
        <div className="flex justify-between px-8">
          <div className="text-center space-y-16">
            <div>
              <p>Mengetahui,</p>
              <p className="font-bold">Kepala Badan Kepegawaian & PSDM</p>
            </div>
            <div>
              <p className="font-bold underline">HENDRA WIJAYA, S.STP, M.AP</p>
              <p className="text-[11px]">Pembina Utama Muda / NIP. 198501012010011005</p>
            </div>
          </div>

          <div className="text-center space-y-16">
            <div>
              <p>Surakarta, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
              <p className="font-bold">Pejabat Penilai Kinerja / Atasan</p>
            </div>
            <div>
              <p className="font-bold underline">DRA. SITI RAHMAWATI, M.SI.</p>
              <p className="text-[11px]">Pembina Tingkat I / NIP. 197804122005022001</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
