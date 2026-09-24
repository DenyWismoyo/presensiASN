"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TARGET_POIN_HARIAN } from "@/data/masterAktivitas";
import { Award, TrendingUp, CheckCircle2, AlertCircle, Clock, Zap } from "lucide-react";

interface KinerjaTrackerCardProps {
  totalPoin: number;
  targetPoin?: number;
  totalKegiatan: number;
  className?: string;
}

export default function KinerjaTrackerCard({
  totalPoin,
  targetPoin = TARGET_POIN_HARIAN,
  totalKegiatan,
  className = "",
}: KinerjaTrackerCardProps) {
  const percentage = Math.min(100, Math.round((totalPoin / targetPoin) * 100));
  const isTercapai = totalPoin >= targetPoin;
  const sisaPoin = Math.max(0, targetPoin - totalPoin);

  return (
    <Card className={`border-emerald-200/80 bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 text-white shadow-md overflow-hidden relative ${className}`}>
      {/* Decorative background glow */}
      <div className="absolute -right-8 -top-8 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

      <CardContent className="p-4 sm:p-5 space-y-3.5 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm tracking-tight flex items-center gap-1.5">
                Capaian Poin Kinerja Harian
                <Badge variant="outline" className="text-[9px] border-emerald-400/40 text-emerald-300 py-0 px-1.5">
                  e-Kinerja BKN
                </Badge>
              </div>
              <p className="text-[11px] text-emerald-200/70">
                Target regulasi harian: <strong>{targetPoin} Poin</strong> (Standar Efektif)
              </p>
            </div>
          </div>

          <Badge
            variant={isTercapai ? "default" : "warning"}
            className="text-[11px] px-2.5 py-0.5 self-start sm:self-auto font-semibold flex items-center gap-1"
          >
            {isTercapai ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Target Tercapai ({percentage}%)
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                Kurang {sisaPoin} Poin ({percentage}%)
              </>
            )}
          </Badge>
        </div>

        {/* Progress Bar Poin */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-300">
                {totalPoin}
              </span>
              <span className="text-xs text-emerald-200/80">/ {targetPoin} Poin</span>
            </div>
            <span className="text-[11px] text-slate-300 font-medium">
              {totalKegiatan} Kegiatan Tercatat
            </span>
          </div>

          <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isTercapai
                  ? "bg-gradient-to-r from-emerald-400 to-teal-300 shadow-sm shadow-emerald-400/50"
                  : "bg-gradient-to-r from-amber-400 to-emerald-400"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-300 pt-1 border-t border-white/10">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            152 Kamus Master Aktivitas Resmi Pemda Aktif
          </span>
          <span className="text-emerald-300 font-semibold">
            {isTercapai ? "Status: Siap Diajukan ke Atasan" : "Status: Tambah Kegiatan untuk Capai Target"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
