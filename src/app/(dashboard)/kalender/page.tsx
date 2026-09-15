"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [currentMonth, setCurrentMonth] = useState(8); // 8 = September (0-indexed)
  const [currentYear, setCurrentYear] = useState(2026);

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

  // Simulasi data status presensi per tanggal
  const getAttendanceForDay = (day: number) => {
    const dayOfWeek = (firstDayIndex + day - 1) % 7;
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Sabtu / Minggu

    if (isWeekend) {
      return { status: "libur", label: "Libur Akhir Pekan", in: "-", out: "-", poin: 0 };
    }
    if (day === 10 || day === 11) {
      return { status: "dinas", label: "Dinas Luar (Rakornas BKN)", in: "08:00", out: "17:00", poin: 350 };
    }
    if (day === 8) {
      return { status: "terlambat", label: "Terlambat", in: "07:44", out: "16:30", poin: 280 };
    }
    if (day > 15) {
      return { status: "mendatang", label: "Belum Berjalan", in: "-", out: "-", poin: 0 };
    }
    return { status: "hadir", label: "Hadir Tepat Waktu", in: "07:18", out: "16:45", poin: 320 };
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-emerald-600" />
            Kalender Kerja & Rekap Presensi Bulanan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Peta absensi bulanan, evaluasi disiplin kerja ASN, dan akumulasi capaian kinerja SKP
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
        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Tingkat Disiplin</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-slate-900 mt-2">97.8%</div>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Memenuhi standar kepegawaian</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Hadir Tepat Waktu</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-slate-900 mt-2">10 Hari</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Dari total 11 hari kerja berjalan</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Terlambat Masuk</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-slate-900 mt-2">1 Kali</div>
            <p className="text-[10px] text-amber-700 mt-0.5">Tanggal 8 September (14 mnt)</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Akumulasi Poin SKP</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-slate-900 mt-2">3.510</div>
            <p className="text-[10px] text-purple-700 mt-0.5">Target: 300 Poin/hari</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid Kalender Bulanan */}
      <Card className="border-slate-200/80 shadow-xs">
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
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600">Hadir</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-600">Terlambat</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-slate-600">Dinas / Cuti</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="text-slate-600">Libur</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {/* Baris Nama Hari */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-slate-600 mb-2">
            <div>Senin</div>
            <div>Selasa</div>
            <div>Rabu</div>
            <div>Kamis</div>
            <div>Jumat</div>
            <div className="text-red-500">Sabtu</div>
            <div className="text-red-500">Minggu</div>
          </div>

          {/* Sel Kalender */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Ruang kosong awal bulan */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] bg-slate-50/60 rounded-xl p-1.5 border border-dashed border-slate-200" />
            ))}

            {/* Sel per tanggal */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const data = getAttendanceForDay(day);
              const isToday = day === 15 && currentMonth === 8 && currentYear === 2026;

              return (
                <div
                  key={`day-${day}`}
                  className={`min-h-[85px] rounded-xl p-2 border transition-all text-xs flex flex-col justify-between ${
                    isToday
                      ? "ring-2 ring-emerald-500 bg-emerald-50/40 border-emerald-300 shadow-xs"
                      : data.status === "hadir"
                      ? "bg-white border-slate-200 hover:border-emerald-300"
                      : data.status === "terlambat"
                      ? "bg-amber-50/50 border-amber-200"
                      : data.status === "dinas"
                      ? "bg-blue-50/50 border-blue-200"
                      : data.status === "libur"
                      ? "bg-slate-100/70 border-slate-200 text-slate-400"
                      : "bg-white border-slate-200 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${isToday ? "text-emerald-700 text-sm" : "text-slate-800"}`}>
                      {day}
                    </span>
                    {data.status === "hadir" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                    {data.status === "terlambat" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    )}
                    {data.status === "dinas" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
                  </div>

                  <div className="space-y-0.5 my-1">
                    {data.status !== "libur" && data.status !== "mendatang" ? (
                      <>
                        <div className="text-[10px] text-slate-600 font-mono">
                          {data.in} - {data.out}
                        </div>
                        <div className="text-[9px] text-emerald-700 font-semibold truncate">
                          +{data.poin} Poin
                        </div>
                      </>
                    ) : (
                      <div className="text-[10px] text-slate-400 italic">
                        {data.label}
                      </div>
                    )}
                  </div>

                  {isToday && (
                    <Badge variant="default" className="text-[8px] py-0 px-1 bg-emerald-600 text-white self-start">
                      Hari Ini
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
