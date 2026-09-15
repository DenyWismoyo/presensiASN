"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import { calculateStorageQuota, formatBytes } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HardDrive, Image as ImageIcon, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";

interface StorageMeterProps {
  compact?: boolean;
  className?: string;
}

export default function StorageMeter({ compact = false, className = "" }: StorageMeterProps) {
  const { user } = useAuth();
  const usedBytes = user?.storageUsedBytes ?? 257949696;
  const limitBytes = user?.storageLimitBytes ?? 1073741824; // 1 GB

  const status = calculateStorageQuota(usedBytes, limitBytes);

  // Estimasi proporsional kategori berkas
  const fotoBytes = Math.round(usedBytes * 0.45);
  const dokumenBytes = Math.round(usedBytes * 0.55);

  if (compact) {
    return (
      <div className={`p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs ${className}`}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
            Penyimpanan Berkas (1 GB)
          </span>
          <span className="font-mono text-[11px] font-bold text-slate-800">
            {status.percentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${status.colorClass} transition-all duration-500`}
            style={{ width: `${status.percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>Terpakai: {status.usedFormatted}</span>
          <span className="font-semibold text-emerald-700">Sisa: {status.remainingFormatted}</span>
        </div>
      </div>
    );
  }

  return (
    <Card className={`border-slate-200/90 shadow-sm overflow-hidden ${className}`}>
      <CardHeader className="pb-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-white">
            <HardDrive className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            Alokasi Penyimpanan ASN (1 GB Cloud Storage)
          </CardTitle>
          <Badge
            variant={status.statusBadgeVariant}
            className="text-[10px] sm:text-xs"
          >
            {status.statusText}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Main Progress Bar & Numbers */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between text-xs">
            <div>
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {status.usedFormatted}
              </span>
              <span className="text-slate-500 ml-1.5">
                dari batas maksimal <strong>{status.limitFormatted}</strong>
              </span>
            </div>
            <span className="text-sm font-bold font-mono text-emerald-700">
              {status.percentage}% Terpakai
            </span>
          </div>

          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${status.colorClass} transition-all duration-500`}
              style={{ width: `${status.percentage}%` }}
            />
          </div>
        </div>

        {/* Breakdown by Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Foto Swafoto & Bukti</span>
            </div>
            <div className="font-bold text-xs text-slate-800">
              {formatBytes(fotoBytes)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              <span>Dokumen PDF / Berkas</span>
            </div>
            <div className="font-bold text-xs text-slate-800">
              {formatBytes(dokumenBytes)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sisa Kuota Tersedia</span>
            </div>
            <div className="font-bold text-xs text-emerald-950">
              {status.remainingFormatted}
            </div>
          </div>
        </div>

        {/* Warning if nearing capacity */}
        {status.isNearlyFull && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Kapasitas penyimpanan hampir penuh. Hapus lampiran berkas draft lama untuk menghemat ruang.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
