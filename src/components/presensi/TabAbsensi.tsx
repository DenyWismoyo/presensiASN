"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePresensiHarian, useCheckInMutation, useCheckOutMutation, useKehadiranStatus } from "@/hooks/usePresensi";
import { useKantorList } from "@/hooks/useKantor";
import { calculateHaversineDistance, detectNearestOffice } from "@/data/masterKantor";
import { KantorUnit } from "@/types";
import CameraCapture from "@/components/presensi/CameraCapture";
import { checkGpsIntegrity } from "@/lib/anti-fraud/client";
import { playSuccessChime, playWarningBeep } from "@/lib/sound";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MotionStaggerContainer, MotionFadeUp } from "@/components/ui/motion-wrapper";
import {
  MapPin,
  CheckCircle2,
  Clock,
  Building,
  Building2,
  AlertCircle,
  Loader2
} from "lucide-react";
import ContextHeroCard from "./ContextHeroCard";

export default function TabAbsensi() {
  const { user } = useAuth();
  const todayDateStr = new Date().toISOString().split("T")[0];

  // Integrasi data realtime Firestore via TanStack Query
  const { data: presensiData, isLoading: isPresensiLoading } = usePresensiHarian(
    user?.id,
    todayDateStr
  );
  
  // Status gabungan
  const { data: kehadiranStatus, isLoading: isKehadiranLoading } = useKehadiranStatus(
    user?.id,
    todayDateStr
  );

  const { data: kantorListFromDb } = useKantorList(user?.orgId);
  const kantorList: KantorUnit[] = kantorListFromDb || [];

  const checkInMutation = useCheckInMutation();
  const checkOutMutation = useCheckOutMutation();

  // Koordinat user dari GPS (null sampai GPS berhasil)
  const [gpsStatus, setGpsStatus] = useState<"locating" | "success" | "denied">("locating");
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | undefined>(undefined);
  const [isMockDetected, setIsMockDetected] = useState<boolean>(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // State foto dari kamera nyata
  const [capturedFotoUrl, setCapturedFotoUrl] = useState<string | null>(
    presensiData?.checkIn?.fotoUrl || null
  );
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [checkOutError, setCheckOutError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsError("Browser tidak mendukung GPS. Presensi tidak dapat dilakukan.");
      setGpsStatus("denied");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const integrity = checkGpsIntegrity(position);
        setGpsAccuracy(integrity.accuracy);

        if (integrity.isMock) {
          setIsMockDetected(true);
          setGpsStatus("denied");
          setGpsError(integrity.warning || "Terdeteksi aplikasi Mock Location (Fake GPS).");
          return;
        }

        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGpsStatus("success");
        setGpsError(null);
      },
      (err) => {
        let msg = "GPS tidak tersedia.";
        if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
          msg = "Izin lokasi GPS ditolak. Aktifkan izin lokasi di browser lalu muat ulang halaman.";
        } else if (err.code === GeolocationPositionError.POSITION_UNAVAILABLE) {
          msg = "Sinyal GPS tidak tersedia di lokasi Anda saat ini.";
        } else if (err.code === GeolocationPositionError.TIMEOUT) {
          msg = "GPS timeout. Pastikan Anda berada di tempat dengan sinyal GPS yang baik.";
        }
        setGpsError(msg);
        setGpsStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Perhitungan jarak untuk semua kantor (hanya jika GPS tersedia)
  const nearestResult = useMemo(() => {
    if (!coords) return null;
    return detectNearestOffice(coords, kantorList);
  }, [coords, kantorList]);

  // Tentukan kantor aktif (auto = terdekat)
  const activeOffice: KantorUnit | undefined = useMemo(() => {
    return nearestResult?.nearestOffice || kantorList[0];
  }, [nearestResult, kantorList]);

  // Hitung jarak ke kantor aktif (null jika GPS tidak tersedia)
  const currentDistance = useMemo(() => {
    if (!coords || !activeOffice) return null;
    return calculateHaversineDistance(coords, activeOffice.koordinat);
  }, [coords, activeOffice]);

  const isWithinRadius = activeOffice ? (currentDistance !== null && currentDistance <= activeOffice.radiusMeter) : false;

  const formatTimeString = (isoString?: string) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return (
      date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    );
  };

  const checkInTime = formatTimeString(presensiData?.checkIn?.waktu);
  const checkOutTime = formatTimeString(presensiData?.checkOut?.waktu);
  const isProcessing = checkInMutation.isPending || checkOutMutation.isPending;

  const handleFotoCaptured = (fotoUrl: string, sizeBytes: number) => {
    setCapturedFotoUrl(fotoUrl);
    console.info(`[Presensi] Foto diupload: ${fotoUrl}, ukuran: ${sizeBytes} bytes`);
  };

  const handleCheckIn = async () => {
    if (!user || !coords || !activeOffice) return;
    if (!capturedFotoUrl) {
      playWarningBeep();
      setCheckInError("Harap ambil swafoto terlebih dahulu sebelum check-in.");
      return;
    }
    if (!isWithinRadius) {
      playWarningBeep();
      setCheckInError(`Anda berada di luar radius kantor (${currentDistance}m dari ${activeOffice.namaKantor}). Check-in tidak diizinkan.`);
      return;
    }

    setCheckInError(null);
    try {
      const result = await checkInMutation.mutateAsync({
        userId: user.id,
        nip: user.nip,
        nama: user.nama,
        orgId: user.orgId,
        tanggal: todayDateStr,
        kantorId: activeOffice.id,
        namaKantor: activeOffice.namaKantor,
        jarakMeter: currentDistance ?? undefined,
        koordinat: coords,
        fotoUrl: capturedFotoUrl,
        isValidLocation: isWithinRadius,
        alamat: activeOffice.alamat,
        catatan: `Presensi Masuk ASN di ${activeOffice.namaKantor}`,
        gpsAccuracyMeter: gpsAccuracy,
        isMockDetected,
      });
      if (!result.success) {
        if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate([50, 100, 50]);
        playWarningBeep();
        setCheckInError(result.message || "Check-in gagal. Coba lagi.");
      } else {
        if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate([100, 50, 100]);
        playSuccessChime();
      }
    } catch (err) {
      playWarningBeep();
      setCheckInError((err as Error).message || "Check-in gagal. Hubungi administrator.");
    }
  };

  const handleCheckOut = async () => {
    if (!user || !coords || !activeOffice) return;
    if (!capturedFotoUrl) {
      playWarningBeep();
      setCheckOutError("Harap ambil swafoto kepulangan terlebih dahulu.");
      return;
    }
    if (capturedFotoUrl === presensiData?.checkIn?.fotoUrl) {
      playWarningBeep();
      setCheckOutError("Anda tidak dapat menggunakan foto Check-In untuk Check-Out. Harap ambil foto baru.");
      return;
    }
    
    setCheckOutError(null);
    try {
      const result = await checkOutMutation.mutateAsync({
        userId: user.id,
        tanggal: todayDateStr,
        kantorId: activeOffice.id,
        namaKantor: activeOffice.namaKantor,
        jarakMeter: currentDistance ?? undefined,
        koordinat: coords,
        fotoUrl: capturedFotoUrl,
        isValidLocation: isWithinRadius,
        alamat: activeOffice.alamat,
        catatan: `Presensi Pulang ASN di ${activeOffice.namaKantor}`,
        gpsAccuracyMeter: gpsAccuracy,
        isMockDetected,
      });
      if (!result.success) {
        if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate([50, 100, 50]);
        playWarningBeep();
        setCheckOutError(result.message || "Check-out gagal. Coba lagi.");
      } else {
        if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate([100, 50, 100]);
        playSuccessChime();
      }
    } catch (err) {
      playWarningBeep();
      setCheckOutError((err as Error).message || "Check-out gagal. Hubungi administrator.");
    }
  };
  
  if (isPresensiLoading || isKehadiranLoading) {
    return (
      <div className="space-y-6 animate-pulse pt-2">
        {/* Skeleton Hero */}
        <div className="h-[120px] bg-slate-200/60 rounded-none sm:rounded-3xl w-full"></div>
        {/* Skeleton GPS Header */}
        <div className="flex justify-between items-center px-4 sm:px-0">
          <div className="space-y-2">
            <div className="h-5 bg-slate-200/60 w-32 rounded-full"></div>
            <div className="h-3 bg-slate-200/60 w-48 rounded-full"></div>
          </div>
          <div className="h-8 bg-slate-200/60 w-24 rounded-full"></div>
        </div>
        {/* Skeleton Office Pill */}
        <div className="h-16 bg-slate-200/60 rounded-none sm:rounded-3xl w-full"></div>
        {/* Skeleton Camera */}
        <div className="h-[300px] bg-slate-200/60 rounded-none sm:rounded-3xl w-full"></div>
        {/* Skeleton Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2 px-4 sm:px-0">
          <div className="h-[60px] bg-slate-200/60 rounded-[20px]"></div>
          <div className="h-[60px] bg-slate-200/60 rounded-[20px]"></div>
        </div>
      </div>
    );
  }

  return (
    <MotionStaggerContainer className="space-y-6">
      
      {/* Hero Card */}
      <MotionFadeUp>
        <ContextHeroCard 
          status={kehadiranStatus?.statusKehadiran} 
          presensiData={presensiData} 
          user={user} 
        />
      </MotionFadeUp>
      
      {/* GPS Header */}
      <MotionFadeUp className="flex items-center justify-between px-4 sm:px-0">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Kamera Presensi</h2>
          <p className="text-[11px] text-slate-500 font-medium">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex items-center">
          {gpsStatus === "success" && activeOffice ? (
            <Badge variant="outline" className={`rounded-full px-3 py-1.5 text-[10px] font-bold border shadow-sm ${isWithinRadius ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              {isWithinRadius ? `✓ ${currentDistance}m` : `✗ Luar Radius`}
            </Badge>
          ) : (
            <Badge variant="outline" className="rounded-full px-3 py-1.5 text-[10px] font-bold border-amber-200 bg-amber-50 text-amber-700 shadow-sm animate-pulse">
              <MapPin className="w-3 h-3 mr-1" /> GPS Loading...
            </Badge>
          )}
        </div>
      </MotionFadeUp>

      {!activeOffice ? (
        <MotionFadeUp className="mt-4 px-4 sm:px-0">
          <div className="card-base p-8 text-center bg-amber-50/80 backdrop-blur-xl border-amber-100 sm:border-amber-100">
            <Building2 className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h3 className="text-lg font-extrabold text-amber-900 mb-2">Belum Ada Lokasi</h3>
            <p className="text-xs text-amber-700/80 leading-relaxed max-w-[250px] mx-auto">
              Admin belum mendaftarkan titik koordinat kantor untuk unit kerja Anda.
            </p>
          </div>
        </MotionFadeUp>
      ) : (
        <MotionFadeUp className="space-y-6 mt-4">
          
          {/* Office Pill Indicator */}
          <div className="card-base bg-white/70 backdrop-blur-xl p-4 flex items-center gap-3.5 relative group border-white/50">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shrink-0 border border-emerald-50">
              <Building className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0 z-10">
              <h2 className="font-bold text-slate-800 text-sm truncate">{activeOffice.namaKantor}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <p className="text-[10px] text-slate-500 font-medium truncate">Target radius {activeOffice.radiusMeter}m</p>
              </div>
            </div>
          </div>

          {/* Camera Hero Section */}
          <div className="relative">
            <CameraCapture
              mode={checkInTime && !checkOutTime ? 'check-out' : 'check-in'}
              userId={user?.id || ""}
              orgId={user?.orgId || ""}
              onCapture={handleFotoCaptured}
              onError={(msg) => checkInTime ? setCheckOutError(msg) : setCheckInError(msg)}
              capturedUrl={checkInTime && !checkOutTime ? null : capturedFotoUrl}
              nip={user?.nip || ""}
              nama={user?.nama || ""}
              namaKantor={activeOffice.namaKantor}
              koordinat={coords}
              accuracyMeter={gpsAccuracy}
            />
          </div>

          {/* Error Banners */}
          {(checkInError || checkOutError) && (
            <div className="bg-rose-50 rounded-none sm:rounded-2xl p-4 border-y sm:border-x border-rose-100 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 font-medium leading-relaxed">{checkInError || checkOutError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2 px-4 sm:px-0">
            <Button
              onClick={handleCheckIn}
              disabled={isProcessing || !!checkInTime || !capturedFotoUrl || !isWithinRadius || gpsStatus !== "success"}
              className={`rounded-[20px] h-[60px] flex flex-col justify-center items-center gap-1 shadow-lg transition-all ${
                checkInTime 
                  ? "bg-slate-100 text-slate-400 border-none shadow-none cursor-not-allowed" 
                  : "bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-emerald-500/25 hover:scale-[0.98] active:scale-95 border-b-4 border-emerald-700"
              }`}
            >
              {checkInTime ? (
                <>
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Sudah Hadir</span>
                  <span className="text-sm font-extrabold">{checkInTime.replace(' WIB', '')}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mb-0.5" />
                  <span className="text-[11px] font-bold tracking-wide">CHECK IN</span>
                </>
              )}
            </Button>

            <Button
              onClick={handleCheckOut}
              disabled={isProcessing || !checkInTime || !!checkOutTime || !capturedFotoUrl || gpsStatus !== "success" || capturedFotoUrl === presensiData?.checkIn?.fotoUrl}
              className={`rounded-[20px] h-[60px] flex flex-col justify-center items-center gap-1 shadow-lg transition-all ${
                !checkInTime || !!checkOutTime 
                  ? "bg-slate-100 text-slate-400 border-none shadow-none cursor-not-allowed" 
                  : "bg-gradient-to-b from-slate-700 to-slate-900 text-white shadow-slate-900/25 hover:scale-[0.98] active:scale-95 border-b-4 border-black"
              }`}
            >
              {checkOutTime ? (
                <>
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Sudah Pulang</span>
                  <span className="text-sm font-extrabold">{checkOutTime.replace(' WIB', '')}</span>
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 mb-0.5 text-teal-400" />
                  <span className="text-[11px] font-bold tracking-wide">CHECK OUT</span>
                </>
              )}
            </Button>
          </div>
        </MotionFadeUp>
      )}
    </MotionStaggerContainer>
  );
}
