"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePresensiHarian, useCheckInMutation, useCheckOutMutation } from "@/hooks/usePresensi";
import { useKantorList } from "@/hooks/useKantor";
import { DEFAULT_KANTOR_LIST, calculateHaversineDistance, detectNearestOffice } from "@/data/masterKantor";
import { KantorUnit } from "@/types";
import CameraCapture from "@/components/presensi/CameraCapture";
import { checkGpsIntegrity } from "@/lib/anti-fraud/client";
import { playSuccessChime, playWarningBeep } from "@/lib/sound";
import MobilePageHeader from "@/components/dashboard/MobilePageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Camera,
  CheckCircle2,
  Clock,
  Navigation,
  History,
  ShieldCheck,
  Building,
  Building2,
  Compass,
  Check,
  AlertCircle,
} from "lucide-react";

export default function PresensiPage() {
  const { user } = useAuth();
  const todayDateStr = new Date().toISOString().split("T")[0];

  // Integrasi data realtime Firestore via TanStack Query
  const { data: presensiData, isLoading: isPresensiLoading } = usePresensiHarian(
    user?.id,
    todayDateStr
  );
  const { data: kantorListFromDb } = useKantorList(user?.orgId);
  const kantorList: KantorUnit[] = kantorListFromDb && kantorListFromDb.length > 0
    ? kantorListFromDb
    : DEFAULT_KANTOR_LIST;

  const checkInMutation = useCheckInMutation();
  const checkOutMutation = useCheckOutMutation();

  // Koordinat user dari GPS (null sampai GPS berhasil)
  const [gpsStatus, setGpsStatus] = useState<"locating" | "success" | "denied">("locating");
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsWarning, setGpsWarning] = useState<string | null>(null);
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

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const integrity = checkGpsIntegrity(position);
        setGpsAccuracy(integrity.accuracy);

        if (integrity.isMock) {
          setIsMockDetected(true);
          setGpsStatus("denied");
          setGpsError(integrity.warning || "Terdeteksi aplikasi Mock Location (Fake GPS).");
          return;
        }

        if (integrity.warning) {
          setGpsWarning(integrity.warning);
        } else {
          setGpsWarning(null);
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Perhitungan jarak untuk semua kantor (hanya jika GPS tersedia)
  const nearestResult = useMemo(() => {
    if (!coords) return null;
    return detectNearestOffice(coords, kantorList);
  }, [coords, kantorList]);

  // Tentukan kantor aktif (auto = terdekat)
  const activeOffice: KantorUnit = useMemo(() => {
    return nearestResult?.nearestOffice || kantorList[0] || DEFAULT_KANTOR_LIST[0];
  }, [nearestResult, kantorList]);

  // Hitung jarak ke kantor aktif (null jika GPS tidak tersedia)
  const currentDistance = useMemo(() => {
    if (!coords) return null;
    return calculateHaversineDistance(coords, activeOffice.koordinat);
  }, [coords, activeOffice]);

  const isWithinRadius = currentDistance !== null && currentDistance <= activeOffice.radiusMeter;

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
  // Foto yang sudah tersimpan dari presensi sebelumnya (Firebase URL)
  const existingFotoUrl = presensiData?.checkIn?.fotoUrl || null;
  const isProcessing = checkInMutation.isPending || checkOutMutation.isPending;

  // Dipanggil oleh CameraCapture setelah foto berhasil diupload ke Firebase Storage
  const handleFotoCaptured = (fotoUrl: string, sizeBytes: number) => {
    setCapturedFotoUrl(fotoUrl);
    // Catat penggunaan storage dari foto presensi
    // (storage tracking opsional, tidak memblokir check-in)
    console.info(`[Presensi] Foto diupload: ${fotoUrl}, ukuran: ${sizeBytes} bytes`);
  };

  const handleCheckIn = async () => {
    if (!user || !coords) return;
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
        playWarningBeep();
        setCheckInError(result.message || "Check-in gagal. Coba lagi.");
      } else {
        playSuccessChime();
      }
    } catch (err) {
      playWarningBeep();
      setCheckInError((err as Error).message || "Check-in gagal. Hubungi administrator.");
    }
  };

  const handleCheckOut = async () => {
    if (!user || !coords) return;
    setCheckOutError(null);
    try {
      const result = await checkOutMutation.mutateAsync({
        userId: user.id,
        tanggal: todayDateStr,
        kantorId: activeOffice.id,
        namaKantor: activeOffice.namaKantor,
        jarakMeter: currentDistance ?? undefined,
        koordinat: coords,
        fotoUrl: existingFotoUrl || capturedFotoUrl || "",
        isValidLocation: isWithinRadius,
        alamat: activeOffice.alamat,
        catatan: `Presensi Pulang ASN di ${activeOffice.namaKantor}`,
        gpsAccuracyMeter: gpsAccuracy,
        isMockDetected,
      });
      if (!result.success) {
        playWarningBeep();
        setCheckOutError(result.message || "Check-out gagal. Coba lagi.");
      } else {
        playSuccessChime();
      }
    } catch (err) {
      playWarningBeep();
      setCheckOutError((err as Error).message || "Check-out gagal. Hubungi administrator.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Contextual Mobile Back Header */}
      <MobilePageHeader
        title="Presensi Swafoto ASN"
        subtitle="Verifikasi lokasi GPS satelit & swafoto dinas"
      />

      {/* Header Halaman (Desktop) */}
      <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-600" />
            Presensi Digital Pegawai ASN
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Perekaman kehadiran multi-kantor berbasis satelit GPS dan verifikasi swafoto ASN
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status GPS */}
          <Badge
            variant={gpsStatus === "success" ? "default" : gpsStatus === "denied" ? "destructive" : "secondary"}
            className="text-xs px-3 py-1 flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5" />
            {gpsStatus === "locating" ? "Mendeteksi GPS..." :
             gpsStatus === "denied" ? "GPS Tidak Tersedia" :
             `GPS Aktif`}
          </Badge>

          {gpsStatus === "success" && (
            <Badge
              variant={isWithinRadius ? "default" : "destructive"}
              className="text-xs px-3 py-1 flex items-center gap-1.5"
            >
              {isWithinRadius ? `✓ Dalam Radius ${activeOffice.radiusMeter}m` : `✗ Di Luar Radius ${activeOffice.radiusMeter}m`}
            </Badge>
          )}
        </div>
      </div>

      {/* Grid Utama Presensi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Kamera & Action Swafoto */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                  <Camera className="w-5 h-5 text-emerald-400" />
                  Verifikasi Swafoto Kamera
                </CardTitle>
                <CardDescription className="text-slate-300 text-xs mt-0.5">
                  Pastikan wajah terlihat jelas dan mengenakan pakaian dinas resmi
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-emerald-300 border-emerald-500/40 text-[10px]">
                Kamera Aktif
              </Badge>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Error GPS Banner */}
              {gpsStatus === "denied" && gpsError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-red-800">GPS Tidak Tersedia</p>
                    <p className="text-xs text-red-700 leading-relaxed">{gpsError}</p>
                  </div>
                </div>
              )}

              {/* GPS Anti-Fraud / Accuracy Warning */}
              {gpsWarning && gpsStatus === "success" && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">{gpsWarning}</p>
                </div>
              )}

              {/* Kamera Selfie Nyata dengan Stempel Forensik Digital */}
              {user && (
                <CameraCapture
                  userId={user.id}
                  orgId={user.orgId}
                  onCapture={handleFotoCaptured}
                  onError={(msg) => setCheckInError(msg)}
                  capturedUrl={existingFotoUrl}
                  nip={user.nip}
                  nama={user.nama}
                  namaKantor={activeOffice.namaKantor}
                  koordinat={coords}
                  accuracyMeter={gpsAccuracy}
                />
              )}

              {/* Error Check-In / Check-Out */}
              {checkInError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{checkInError}</p>
                </div>
              )}
              {checkOutError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{checkOutError}</p>
                </div>
              )}

              {/* Action Buttons: Check-In & Check-Out */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={handleCheckIn}
                  disabled={isProcessing || !!checkInTime || !capturedFotoUrl || !isWithinRadius || gpsStatus !== "success"}
                  className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  {checkInTime ? `Sudah Masuk: ${checkInTime}` :
                   !capturedFotoUrl ? "Ambil Foto Dulu" :
                   !isWithinRadius ? "Di Luar Radius" :
                   "Check-In Masuk Kerja"}
                </Button>

                <Button
                  onClick={handleCheckOut}
                  disabled={isProcessing || !checkInTime || !!checkOutTime || gpsStatus !== "success"}
                  variant="outline"
                  className="h-12 border-slate-300 hover:bg-slate-100 font-semibold text-sm text-slate-800 disabled:opacity-50"
                >
                  <Clock className="w-5 h-5 mr-2 text-teal-600" />
                  {checkOutTime ? `Sudah Pulang: ${checkOutTime}` : "Check-Out Pulang Kerja"}
                </Button>
              </div>

              {/* Ketentuan Jam Kerja ASN */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Aturan Jam Presensi Hari Kerja ({activeOffice.namaKantor})
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div>
                    • <strong>Batas Masuk:</strong> {activeOffice.jamMasukMaksimal || "07:30"} WIB (lewat = terlambat)
                  </div>
                  <div>
                    • <strong>Jam Pulang:</strong> Minimal {activeOffice.jamPulangMinimal || "16:00"} WIB
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Detail Geofencing & Multi-Kantor Radar */}
        <div className="space-y-6">
          {/* Card Lokasi & Geofence Aktif */}
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-600" />
                  Titik Kantor ASN Terpilih
                </span>
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-700">
                  {activeOffice.kategori}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-800 flex items-start gap-2">
                  <Building className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <div>{activeOffice.namaKantor}</div>
                    <div className="text-[10px] text-slate-500 font-normal leading-relaxed mt-0.5">
                      {activeOffice.alamat}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Jarak Posisi Anda ke Kantor:</span>
                {gpsStatus === "success" && currentDistance !== null ? (
                  <div
                    className={`p-2.5 rounded-lg border font-bold flex items-center justify-between ${
                      isWithinRadius
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : "bg-red-50 border-red-200 text-red-900"
                    }`}
                  >
                    <span>{currentDistance} Meter</span>
                    <Badge variant={isWithinRadius ? "default" : "destructive"} className="text-[10px]">
                      {isWithinRadius ? `✓ Valid (≤${activeOffice.radiusMeter}m)` : `✗ Di Luar ${activeOffice.radiusMeter}m`}
                    </Badge>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg border bg-amber-50 border-amber-200 text-amber-800 text-[11px]">
                    GPS belum aktif — aktifkan izin lokasi di browser Anda
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Koordinat GPS Anda:</span>
                <div className="p-2 rounded-lg bg-slate-100 font-mono text-[11px] text-slate-700">
                  {coords
                    ? `Lat: ${coords.lat.toFixed(6)} | Lng: ${coords.lng.toFixed(6)}`
                    : "GPS belum tersedia"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Radar Daftar Kantor Terdekat */}
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-teal-600" />
                  Daftar Titik Kantor Dinas ({kantorList.length})
                </span>
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-500">
                Menampilkan jarak real-time dari posisi GPS Anda ke setiap kantor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {(nearestResult?.allOfficesWithDistance ?? kantorList.map(k => ({
                office: k,
                distanceMeters: null,
                isWithinRadius: false,
              }))).map(({ office, distanceMeters, isWithinRadius: inRad }) => {
                const isCurrentActive = office.id === activeOffice.id;
                return (
                  <div
                    key={office.id}
                    className={`p-2.5 rounded-lg border transition-all ${
                      isCurrentActive
                        ? "bg-teal-50/70 border-teal-300 ring-1 ring-teal-400"
                        : "bg-slate-50/80 border-slate-200"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5 truncate">
                        {isCurrentActive && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                        <span className="truncate">{office.namaKantor}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-slate-300">
                          {office.kodeKantor}
                        </Badge>
                        {distanceMeters !== null ? (
                          <span>• Jarak: {distanceMeters}m {inRad ? "✓" : ""}</span>
                        ) : (
                          <span>• GPS belum aktif</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Riwayat Presensi Hari Ini */}
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" />
                Rekaman Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800">Check-In Masuk</div>
                  <div className="text-[11px] text-slate-500">
                    {checkInTime || "Belum terekam"}
                  </div>
                  {presensiData?.checkIn?.namaKantor && (
                    <div className="text-[10px] text-emerald-600 font-medium">
                      📍 {presensiData.checkIn.namaKantor}
                    </div>
                  )}
                </div>
                <Badge
                  variant={checkInTime ? "default" : "secondary"}
                  className="text-[10px]"
                >
                  {checkInTime ? "Hadir Tepat Waktu" : "Menunggu"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800">Check-Out Pulang</div>
                  <div className="text-[11px] text-slate-500">
                    {checkOutTime || "Belum terekam"}
                  </div>
                  {presensiData?.checkOut?.namaKantor && (
                    <div className="text-[10px] text-teal-600 font-medium">
                      📍 {presensiData.checkOut.namaKantor}
                    </div>
                  )}
                </div>
                <Badge
                  variant={checkOutTime ? "default" : "secondary"}
                  className="text-[10px]"
                >
                  {checkOutTime ? "Selesai Kerja" : "Belum Waktunya"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
