"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import { useRiwayatPresensi } from "@/hooks/usePresensi";
import { MotionStaggerContainer, MotionFadeUp } from "@/components/ui/motion-wrapper";
import { Badge } from "@/components/ui/badge";
import {
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Timer,
  Loader2,
  Calendar
} from "lucide-react";
import { PresensiRecord } from "@/types";

export default function TabRiwayat() {
  const { user } = useAuth();
  const { data: riwayat = [], isLoading } = useRiwayatPresensi(user?.id, 30); // Ambil 30 hari terakhir

  // Fungsi helper icon dan warna untuk status
  const getStatusDisplay = (record: PresensiRecord) => {
    let icon = <CheckCircle2 className="w-5 h-5 text-slate-400" />;
    let colorClass = "bg-slate-50 border-slate-200 text-slate-600";
    let label = "Tidak Hadir";

    if (record.status === "hadir") {
      icon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      colorClass = "bg-emerald-50 border-emerald-200 text-emerald-700";
      label = "Hadir";
    } else if (record.status === "terlambat") {
      icon = <AlertCircle className="w-5 h-5 text-amber-500" />;
      colorClass = "bg-amber-50 border-amber-200 text-amber-700";
      label = "Terlambat";
    } else if (["izin", "cuti", "sakit", "dinas_luar"].includes(record.status || "")) {
      icon = <FileText className="w-5 h-5 text-violet-500" />;
      colorClass = "bg-violet-50 border-violet-200 text-violet-700";
      label = record.status ? record.status.toUpperCase().replace("_", " ") : "Izin";
    } else if (record.status === "lembur") {
      icon = <Timer className="w-5 h-5 text-blue-500" />;
      colorClass = "bg-blue-50 border-blue-200 text-blue-700";
      label = "Lembur";
    }

    return { icon, colorClass, label };
  };

  const formatWaktu = (iso?: string) => {
    if (!iso) return "--:--";
    return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <MotionStaggerContainer className="space-y-6 px-4 sm:px-0 pt-2">
      <MotionFadeUp className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-slate-400" />
          Riwayat 30 Hari
        </h2>
        <Badge variant="outline" className="bg-white px-2 py-0.5 text-[10px] text-slate-500 font-bold border-slate-200">
          {riwayat.length} Rekaman
        </Badge>
      </MotionFadeUp>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-slate-500 text-sm font-medium">Memuat riwayat...</p>
        </div>
      ) : riwayat.length === 0 ? (
        <MotionFadeUp className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Calendar className="w-12 h-12 mx-auto text-slate-200 mb-3" />
          <p className="text-sm font-bold text-slate-400">Belum ada riwayat kehadiran.</p>
        </MotionFadeUp>
      ) : (
        <div className="space-y-4">
          {riwayat.map((record, index) => {
            const { icon, colorClass, label } = getStatusDisplay(record);
            return (
              <MotionFadeUp key={record.id} className="relative">
                {/* Timeline connector line */}
                {index !== riwayat.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-[-16px] w-[2px] bg-slate-100 z-0" />
                )}
                
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative z-10 flex gap-4">
                  <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center shrink-0 border ${colorClass}`}>
                    <span className="text-[10px] font-extrabold leading-none mb-0.5">
                      {new Date(record.tanggal).getDate()}
                    </span>
                    <span className="text-[8px] font-bold uppercase opacity-80 leading-none">
                      {new Date(record.tanggal).toLocaleDateString("id-ID", { month: "short" })}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-extrabold text-slate-800">{label}</h3>
                      {icon}
                    </div>
                    
                    {["izin", "cuti", "sakit", "dinas_luar", "lembur"].includes(record.status || "") ? (
                      <p className="text-[11px] text-slate-500 font-medium">
                        Disetujui otomatis tersinkronisasi.
                      </p>
                    ) : (
                      <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{formatWaktu(record.checkIn?.waktu)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-teal-400" />
                          <span>{formatWaktu(record.checkOut?.waktu)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </MotionFadeUp>
            );
          })}
        </div>
      )}
    </MotionStaggerContainer>
  );
}
