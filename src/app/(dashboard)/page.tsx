"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRiwayatPresensi } from "@/hooks/usePresensi";
import { useLKHHarian } from "@/hooks/useLKH";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ClockCheck,
  FileSpreadsheet,
  MapPin,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  FileText,
  Building,
  UserCheck2,
  Inbox,
  Clock,
} from "lucide-react";
import { motion, Variants } from "framer-motion";

import QuickPresensiWidget from "@/components/dashboard/QuickPresensiWidget";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 24 
    } 
  }
};

export default function DashboardPage() {
  const { user } = useAuth();
  const todayDateStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Ambil data presensi hari ini
  const { data: riwayatPresensi = [] } = useRiwayatPresensi(user?.id, 30);
  const { data: lkhToday } = useLKHHarian(user?.id, todayDateStr);

  // Hitung statistik presensi dari riwayat nyata
  const stats = useMemo(() => {
    let hadir = 0;
    let terlambat = 0;
    let izin = 0;

    riwayatPresensi.forEach((r) => {
      if (r.status === "hadir") hadir++;
      else if (r.status === "terlambat") terlambat++;
      else if (["izin", "sakit", "cuti"].includes(r.status)) izin++;
    });

    const totalHari = riwayatPresensi.length || 1;
    const rate = Math.round((hadir / totalHari) * 100);

    return {
      hadirHari: hadir,
      terlambatKali: terlambat,
      izinHari: izin,
      rate: Math.min(100, Math.max(0, rate)),
    };
  }, [riwayatPresensi]);

  const kegiatanList = lkhToday?.kegiatan || [];

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="show" 
      className="space-y-6"
    >
      {/* Hero ASN Welcome Banner */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-none sm:rounded-3xl border-x-0 sm:border border-emerald-700/50 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-5 sm:p-6 md:p-8 text-white shadow-none sm:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-medium">
              <Building className="w-3.5 h-3.5 text-emerald-300" />
              {user?.instansi || "Perusahaan XYZ - Kantor Pusat"}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Selamat Bertugas, {user?.nama || "Pegawai ASN"}
            </h1>
            <p className="text-emerald-100/80 text-xs md:text-sm leading-relaxed">
              {user?.jabatan} • NIP: {user?.nip} • Golongan {user?.golongan}
            </p>
          </div>

          <div className="flex w-full md:w-auto gap-2.5 pt-1 md:pt-0">
            <Link href="/presensi" className="flex-1 md:flex-initial">
              <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs h-10 px-5 shadow-md">
                <ClockCheck className="w-4 h-4 mr-1.5" />
                Presensi
              </Button>
            </Link>
            <Link href="/laporan" className="flex-1 md:flex-initial">
              <Button
                variant="outline"
                className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-10 px-5"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                LKH Harian
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Grid: Status Hari Ini (Live Radar Presensi & LKH) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-start">
        {/* Radar Presensi Real-Time & 1-Tap Action */}
        <QuickPresensiWidget />

        {/* Card Laporan Kegiatan Harian (LKH) Hari Ini */}
        <Card className="card-interactive">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-teal-600" />
                LKH Harian (Kegiatan)
              </CardTitle>
              <CardDescription className="text-xs">
                Laporan pelaksanaan tugas kinerja ASN hari ini
              </CardDescription>
            </div>
            <Badge
              variant={lkhToday?.status === "approved" ? "default" : lkhToday?.status === "submitted" ? "info" : "secondary"}
              className="text-xs px-2.5 py-0.5 capitalize"
            >
              {lkhToday?.status ? `Status: ${lkhToday.status}` : "Belum Ada LKH"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            {kegiatanList.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border-0 text-center text-slate-400 space-y-1.5">
                <Inbox className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">Belum ada kegiatan kinerja yang dicatat hari ini.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {kegiatanList.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-50 border-0 text-xs flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-800">{item.deskripsi}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.jamMulai} - {item.jamSelesai} • Output: {item.outputKegiatan}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      +{item.totalPoin} Poin
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <Link href="/laporan" className="w-full">
                <Button className="w-full text-xs h-9 bg-teal-600 hover:bg-teal-700 text-white font-medium">
                  {kegiatanList.length > 0 ? "Buka / Lanjutkan LKH Hari Ini" : "+ Tambah Kegiatan LKH Hari Ini"}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Statistik Kehadiran Bulanan Berdasarkan Riwayat Nyata */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-3 sm:px-0">
        <Card className="card-interactive p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Hadir Tepat Waktu</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.hadirHari} Hari</div>
          <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" /> Rekap Bulan Ini
          </div>
        </Card>

        <Card className="card-interactive p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Terlambat</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.terlambatKali} Kali</div>
          <div className="text-[11px] text-amber-600">Evaluasi Disiplin ASN</div>
        </Card>

        <Card className="card-interactive p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Izin / Cuti Resmi</span>
            <CalendarDays className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.izinHari} Hari</div>
          <div className="text-[11px] text-blue-600">Terlampir Surat Resmi</div>
        </Card>

        <Card className="card-interactive p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Penilai Kinerja</span>
            <FileText className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {user?.atasanNama || "Kepala Unit Kerja"}
          </div>
          <div className="text-[11px] text-teal-600 flex items-center gap-1">
            <UserCheck2 className="w-3 h-3" /> Atasan Langsung
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
