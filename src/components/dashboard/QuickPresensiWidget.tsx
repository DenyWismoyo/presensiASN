"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { usePresensiHarian } from "@/hooks/usePresensi";
import { useKantorList } from "@/hooks/useKantor";
import { detectNearestOffice, DEFAULT_KANTOR_LIST } from "@/data/masterKantor";
import { GeolocationPoint, KantorUnit } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ClockCheck,
  MapPin,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function QuickPresensiWidget() {
  const { user } = useAuth();
  const todayDateStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Data presensi & kantor
  const { data: presensiToday } = usePresensiHarian(user?.id, todayDateStr);
  const { data: officeListFromDb } = useKantorList(user?.orgId);

  const activeOffices: KantorUnit[] = useMemo(() => {
    if (officeListFromDb && officeListFromDb.length > 0) {
      return officeListFromDb.filter((k) => k.isActive);
    }
    return DEFAULT_KANTOR_LIST;
  }, [officeListFromDb]);

  // Geolocation state
  const [userCoords, setUserCoords] = useState<GeolocationPoint | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(true);

  // Waktu & Countdown state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const refreshLocation = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGpsError("GPS tidak didukung oleh perangkat ini.");
      setIsLocating(false);
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    // Haptic feedback saat refresh
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate(20);
      } catch {}
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        setIsLocating(false);
      },
      (err) => {
        let msg = "Gagal membaca sinyal satelit GPS.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Izin akses lokasi GPS ditolak di browser Anda.";
        } else if (err.code === err.TIMEOUT) {
          msg = "Waktu pembacaan sinyal GPS habis.";
        }
        setGpsError(msg);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  }, []);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  // Hitung kantor terdekat dan radius
  const nearestResult = useMemo(() => {
    if (!userCoords) return null;
    return detectNearestOffice(userCoords, activeOffices);
  }, [userCoords, activeOffices]);

  // Status presensi
  const isCheckedIn = Boolean(presensiToday?.checkIn?.waktu);
  const isCheckedOut = Boolean(presensiToday?.checkOut?.waktu);

  const checkInTimeStr = presensiToday?.checkIn?.waktu
    ? new Date(presensiToday.checkIn.waktu).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    : null;

  const checkOutTimeStr = presensiToday?.checkOut?.waktu
    ? new Date(presensiToday.checkOut.waktu).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    : null;

  // Analisis jam saat ini (WIB)
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const isAfternoon = currentHour >= 16;
  const isMorningLate = currentHour > 7 || (currentHour === 7 && currentMinute > 30);

  // Hitung sisa waktu presensi pagi (07:30 WIB)
  const morningRemainingStr = useMemo(() => {
    if (isMorningLate || currentHour < 6) return null;
    const target = new Date();
    target.setHours(7, 30, 0, 0);
    const diffMs = target.getTime() - currentTime.getTime();
    if (diffMs <= 0) return null;
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${diffMins}m ${diffSecs}s lagi`;
  }, [currentTime, currentHour, isMorningLate]);

  const nearestOffice = nearestResult?.nearestOffice;
  const distance = nearestResult?.distanceMeters ?? null;
  const isWithinRadius = nearestResult?.isWithinRadius ?? false;

  const handleWidgetActionClick = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([30, 50, 30]);
      } catch {}
    }
  };

  return (
    <Card className="overflow-hidden border-slate-200/80 shadow-md bg-white rounded-2xl">
      {/* Header bar dengan status GPS & live radar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-4 text-white">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Navigation className="w-4 h-4 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-ping" />
            </div>
            <div>
              <h2 className="text-xs font-bold tracking-tight flex items-center gap-1.5">
                RADAR PRESENSI MOBILE
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-emerald-400/40 text-emerald-300">
                  REAL-TIME GPS
                </Badge>
              </h2>
              <p className="text-[10px] text-slate-300 truncate max-w-[220px]">
                {nearestOffice ? nearestOffice.namaKantor : "Mencari kantor terdekat..."}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={refreshLocation}
            disabled={isLocating}
            className="h-7 w-7 p-0 text-slate-300 hover:text-white hover:bg-white/10 rounded-full"
            title="Segarkan Sinyal GPS"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLocating && "animate-spin text-emerald-400")} />
          </Button>
        </div>
      </div>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Status Radar & Jarak ke Kantor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Box Jarak & Geofence */}
          <div
            className={cn(
              "p-3 rounded-xl border flex items-center gap-3 transition-colors",
              isLocating
                ? "bg-slate-50 border-slate-200"
                : isWithinRadius
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                : "bg-amber-50/70 border-amber-200 text-amber-900"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs",
                isLocating
                  ? "bg-slate-200 text-slate-600"
                  : isWithinRadius
                  ? "bg-emerald-600 text-white"
                  : "bg-amber-500 text-white"
              )}
            >
              <MapPin className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Jarak ke Titik Kantor
              </div>
              <div className="text-base font-extrabold flex items-baseline gap-1.5 truncate">
                {isLocating ? (
                  <span className="text-xs text-slate-500 font-medium">Mendeteksi koordinat...</span>
                ) : distance !== null ? (
                  <>
                    <span>{distance} m</span>
                    <span className="text-[11px] font-medium text-slate-500">
                      (Batas {nearestOffice?.radiusMeter || 150}m)
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-red-600">Sinyal GPS Off</span>
                )}
              </div>
              <div className="text-[10px] font-semibold mt-0.5">
                {isLocating ? (
                  <span className="text-slate-400">Menghubungkan satelit...</span>
                ) : isWithinRadius ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Dalam Radius Kantor Resmi
                  </span>
                ) : (
                  <span className="text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    Di Luar Radius Kantor
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Box Jadwal & Waktu ASN */}
          <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Jam Kerja ASN Hari Ini
              </div>
              <div className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                <span>07:30 - 16:00 WIB</span>
                {morningRemainingStr && !isCheckedIn && (
                  <Badge variant="warning" className="text-[9px] px-1.5 py-0 animate-pulse">
                    {morningRemainingStr}
                  </Badge>
                )}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                {isCheckedIn
                  ? `Masuk: ${checkInTimeStr}`
                  : isMorningLate
                  ? "Melewati 07:30 (Terhitung Terlambat)"
                  : "Tepat waktu jika presensi sekarang"}
              </div>
            </div>
          </div>
        </div>

        {/* Peringatan jika GPS Error / Di Luar Radius */}
        {gpsError && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}

        {/* Tombol Aksi Cepat Presensi Ponsel */}
        <div className="pt-1">
          {isCheckedIn && isCheckedOut ? (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <div>
                  <div className="text-xs font-bold">Presensi Hari Ini Telah Lengkap</div>
                  <div className="text-[10px] text-emerald-100">
                    Masuk: {checkInTimeStr} • Pulang: {checkOutTimeStr}
                  </div>
                </div>
              </div>
              <Badge className="bg-white/20 hover:bg-white/30 text-white text-[10px] border-none">
                Selesai
              </Badge>
            </div>
          ) : isCheckedIn && !isCheckedOut ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-500 font-medium">Status Masuk:</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {checkInTimeStr}
                </span>
              </div>

              <Link href="/presensi" onClick={handleWidgetActionClick} className="block w-full">
                <Button
                  className={cn(
                    "w-full h-12 text-sm font-bold shadow-md flex items-center justify-center gap-2 rounded-xl transition-all active:scale-[0.99]",
                    isAfternoon
                      ? "bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white ring-2 ring-orange-400/30"
                      : "bg-slate-800 hover:bg-slate-900 text-white"
                  )}
                >
                  <ClockCheck className="w-5 h-5" />
                  <span>
                    {isAfternoon
                      ? "Ambil Presensi Pulang Sekarang"
                      : "Presensi Pulang (Dibuka 16:00 WIB)"}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
                </Button>
              </Link>
            </div>
          ) : (
            <Link href="/presensi" onClick={handleWidgetActionClick} className="block w-full">
              <Button
                className={cn(
                  "w-full h-13 text-sm font-bold shadow-lg flex items-center justify-center gap-2.5 rounded-xl transition-all active:scale-[0.99]",
                  isWithinRadius
                    ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white ring-4 ring-emerald-500/25 animate-pulse"
                    : "bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white"
                )}
              >
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <ClockCheck className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="leading-tight">
                    {isWithinRadius
                      ? "Ambil Swafoto Presensi Masuk"
                      : "Menuju Halaman Presensi"}
                  </div>
                  <div className="text-[10px] font-normal text-emerald-100/90 leading-tight">
                    {isWithinRadius
                      ? `Terdeteksi dalam radius ${nearestOffice?.namaKantor || "kantor"}`
                      : "Periksa lokasi dan foto dinas ASN"}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto opacity-80" />
              </Button>
            </Link>
          )}
        </div>

        {/* Mini Footer: GPS Satelit Info & Akurasi */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Zero-Trust Server Verified
          </span>
          <span>
            Akurasi Sinyal:{" "}
            <strong className="text-slate-700 font-semibold">
              {gpsAccuracy !== null ? `±${gpsAccuracy}m` : "-"}
            </strong>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
