"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRiwayatPresensi } from "@/hooks/usePresensi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MobilePageHeader from "@/components/dashboard/MobilePageHeader";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Award,
  TrendingUp,
  Building,
  UserCheck,
} from "lucide-react";

export default function KalenderPage() {
  const { user } = useAuth();
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  // Ambil data riwayat presensi riil pegawai
  const { data: riwayat = [] } = useRiwayatPresensi(user?.id, 60);

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Jumlah hari dalam bulan terpilih
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Senin = 0

  // Peta data presensi per tanggal YYYY-MM-DD
  const attendanceMap = useMemo(() => {
    const map = new Map<string, (typeof riwayat)[0]>();
    riwayat.forEach((r) => {
      map.set(r.tanggal, r);
    });
    return map;
  }, [riwayat]);

  // Evaluasi status hari
  const getAttendanceForDay = (day: number) => {
    const dayOfWeek = (firstDayIndex + day - 1) % 7;
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Sabtu / Minggu

    if (isWeekend) {
      return { status: "libur", label: "Libur Akhir Pekan", in: "-", out: "-", poin: 0 };
    }

    const monthStr = String(currentMonth + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const dateKey = `${currentYear}-${monthStr}-${dayStr}`;

    const todayDate = new Date();
    const cellDate = new Date(currentYear, currentMonth, day);

    // Tanggal mendatang
    if (cellDate > todayDate) {
      return { status: "mendatang", label: "Belum Berjalan", in: "-", out: "-", poin: 0 };
    }

    // Cek di riwayat riil
    const found = attendanceMap.get(dateKey);
    if (found) {
      const inTime = found.checkIn?.waktu
        ? new Date(found.checkIn.waktu).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        : "-";
      const outTime = found.checkOut?.waktu
        ? new Date(found.checkOut.waktu).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        : "-";

      if (found.status === "terlambat") {
        return { status: "terlambat", label: "Terlambat", in: inTime, out: outTime, poin: 280 };
      }
      if (found.status === "dinas") {
        return { status: "dinas", label: "Dinas Luar", in: inTime, out: outTime, poin: 350 };
      }
      return { status: "hadir", label: "Hadir", in: inTime, out: outTime, poin: 300 };
    }

    // Hari kerja yang telah lewat tapi belum ada data
    return { status: "belum", label: "Belum Terekam", in: "-", out: "-", poin: 0 };
  };

  // Metrik bulanan dari data riil
  const metrics = useMemo(() => {
    let totalHadir = 0;
    let totalTerlambat = 0;
    let totalHariKerja = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const att = getAttendanceForDay(d);
      if (att.status !== "libur" && att.status !== "mendatang") {
        totalHariKerja++;
        if (att.status === "hadir") totalHadir++;
        if (att.status === "terlambat") totalTerlambat++;
      }
    }

    const disiplinRate = totalHariKerja > 0 ? Math.round((totalHadir / totalHariKerja) * 100) : 100;

    return {
      disiplinRate,
      totalHadir,
      totalTerlambat,
      totalHariKerja,
    };
  }, [daysInMonth, attendanceMap, currentMonth, currentYear]);

  return (
    <div className="space-y-6">
      {/* Contextual Mobile Back Header */}
      <MobilePageHeader
        title="Kalender Kerja & Hari Libur"
        subtitle="Jadwal dinas, presensi bulanan, dan evaluasi disiplin"
      />

      {/* Header Halaman (Desktop) */}
      <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-emerald-600" />
            Kalender Kerja & Rekap Presensi Bulanan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Peta absensi bulanan dan evaluasi disiplin kerja Kantor Pusat
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-xs font-bold px-3 py-1 bg-white rounded-lg border border-slate-200">
            {monthNames[currentMonth]} {currentYear}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Baris Ringkasan Metrik Bulanan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Tingkat Disiplin</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-slate-900 mt-2">{metrics.disiplinRate}%</div>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Memenuhi standar kepegawaian</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Hadir Tepat Waktu</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-slate-900 mt-2">{metrics.totalHadir} Hari</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Dari total {metrics.totalHariKerja} hari kerja berjalan</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Terlambat Masuk</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-slate-900 mt-2">{metrics.totalTerlambat} Kali</div>
            <p className="text-[10px] text-amber-700 mt-0.5">Evaluasi jam kedatangan</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Lokasi Kantor</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Building className="w-4 h-4" />
              </div>
            </div>
            <div className="text-sm font-bold text-slate-900 mt-2 truncate">Kantor Pusat</div>
            <p className="text-[10px] text-purple-700 mt-0.5">Kawasan Surakarta</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid Kalender Bulanan */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">
              Lembar Kehadiran: {monthNames[currentMonth]} {currentYear}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Jadwal resmi hari kerja ASN: Senin s/d Jumat (07:30 - 16:00 WIB)
            </CardDescription>
          </div>

          {/* Legenda Warna */}
          <div className="hidden sm:flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Hadir
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Terlambat
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              Libur
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {/* Header Nama Hari */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-slate-500">
            <div>Sen</div>
            <div>Sel</div>
            <div>Rab</div>
            <div>Kam</div>
            <div>Jum</div>
            <div className="text-red-500">Sab</div>
            <div className="text-red-500">Min</div>
          </div>

          {/* Grid Tanggal */}
          <div className="grid grid-cols-7 gap-2">
            {/* Slot Kosong Sebelum Hari Pertama */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-xl bg-slate-50/50 border border-transparent" />
            ))}

            {/* Kotak Tanggal */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const att = getAttendanceForDay(day);

              return (
                <div
                  key={`day-${day}`}
                  className={`h-20 sm:h-24 p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all ${
                    att.status === "libur"
                      ? "bg-slate-50/60 border-slate-200/50 text-slate-400"
                      : att.status === "hadir"
                      ? "bg-emerald-50/50 border-emerald-200 text-slate-800 hover:shadow-xs"
                      : att.status === "terlambat"
                      ? "bg-amber-50/50 border-amber-200 text-slate-800 hover:shadow-xs"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{day}</span>
                    {att.status === "hadir" && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                    {att.status === "terlambat" && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </div>

                  <div className="text-[9px] sm:text-[10px] space-y-0.5">
                    {att.status === "libur" ? (
                      <div className="text-slate-400 italic">Libur</div>
                    ) : att.status === "mendatang" ? (
                      <div className="text-slate-400 italic">-</div>
                    ) : att.status === "belum" ? (
                      <div className="text-slate-400 italic">Belum tercatat</div>
                    ) : (
                      <>
                        <div className="text-emerald-700 font-medium">In: {att.in}</div>
                        <div className="text-slate-500">Out: {att.out}</div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
