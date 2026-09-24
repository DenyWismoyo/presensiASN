"use client";

import React from "react";
import { User, CheckCircle2, AlertCircle, Calendar, Timer, MapPin, FileText } from "lucide-react";
import { PresensiRecord, PresensiStatus } from "@/types";

interface ContextHeroCardProps {
  status?: PresensiStatus | "belum_absen" | null;
  presensiData?: PresensiRecord | null;
  user?: any;
}

export default function ContextHeroCard({ status, presensiData, user }: ContextHeroCardProps) {
  // Config default state
  let bgGradient = "from-slate-800 to-slate-900";
  let title = "Selamat Datang";
  let subtitle = "Silakan lakukan presensi kehadiran Anda.";
  let Icon = Calendar;
  let iconColor = "text-slate-400";

  switch (status) {
    case "hadir":
      bgGradient = "from-emerald-500 to-teal-600";
      title = "Hadir";
      subtitle = "Anda sudah check-in hari ini. Jangan lupa check-out nanti.";
      Icon = CheckCircle2;
      iconColor = "text-emerald-100";
      if (presensiData?.checkOut) {
        title = "Selesai";
        subtitle = "Anda sudah menyelesaikan presensi hari ini. Terima kasih!";
      }
      break;
    case "terlambat":
      bgGradient = "from-amber-500 to-orange-600";
      title = "Terlambat";
      subtitle = "Anda check-in melewati batas waktu maksimal.";
      Icon = AlertCircle;
      iconColor = "text-amber-100";
      break;
    case "izin":
    case "sakit":
    case "cuti":
    case "dinas":
      bgGradient = "from-violet-500 to-purple-600";
      title = status.toUpperCase().replace("_", " ");
      subtitle = "Anda sedang dalam status izin terverifikasi.";
      Icon = FileText;
      iconColor = "text-violet-100";
      break;
    case "lembur":
      bgGradient = "from-blue-500 to-indigo-600";
      title = "Lembur";
      subtitle = "Anda sedang dalam tugas lembur.";
      Icon = Timer;
      iconColor = "text-blue-100";
      break;
  }

  return (
    <div className={`relative overflow-hidden rounded-none sm:rounded-3xl bg-gradient-to-br ${bgGradient} p-5 sm:p-6 text-white shadow-md sm:shadow-lg border-y sm:border-x border-white/10`}>
      <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="space-y-1 pt-1">
          <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
          <p className="text-xs text-white/80 leading-relaxed font-medium">
            {subtitle}
          </p>
        </div>
      </div>
      
      {/* User Info Bar */}
      <div className="relative z-10 mt-5 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-3 text-[11px] font-medium text-white/90">
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 opacity-70" />
          <span>{user?.nama || "Loading..."}</span>
        </div>
        {presensiData?.checkIn && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 opacity-70" />
            <span className="truncate max-w-[120px]">{presensiData.checkIn.namaKantor}</span>
          </div>
        )}
      </div>
    </div>
  );
}

