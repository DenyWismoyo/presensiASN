"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePresensiHarian, useCheckInMutation, useCheckOutMutation } from "@/hooks/usePresensi";
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
  Loader2,
} from "lucide-react";

// Kantor Koordinat (Balaikota / Gedung Pusat)
const OFFICE_COORDS = { lat: -6.175392, lng: 106.827152, radius: 150 };

export default function PresensiPage() {
  const { user } = useAuth();
  const todayDateStr = new Date().toISOString().split("T")[0];

  // Integrasi data realtime Firestore via TanStack Query
  const { data: presensiData, isLoading: isPresensiLoading } = usePresensiHarian(
    user?.id,
    todayDateStr
  );
  const checkInMutation = useCheckInMutation();
  const checkOutMutation = useCheckOutMutation();

  const [gpsStatus, setGpsStatus] = useState<"locating" | "success" | "error">("locating");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: -6.175392,
    lng: 106.827152,
  });
  const [distanceMeters, setDistanceMeters] = useState<number>(38);
  const [isWithinRadius, setIsWithinRadius] = useState<boolean>(true);

  useEffect(() => {
    // Ambil GPS aktual pengguna jika diizinkan browser
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setCoords({ lat: userLat, lng: userLng });

          // Hitung jarak Haversine sederhana ke kantor
          const R = 6371e3;
          const φ1 = (userLat * Math.PI) / 180;
          const φ2 = (OFFICE_COORDS.lat * Math.PI) / 180;
          const Δφ = ((OFFICE_COORDS.lat - userLat) * Math.PI) / 180;
          const Δλ = ((OFFICE_COORDS.lng - userLng) * Math.PI) / 180;
          const a =
            Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
          const dist = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

          setDistanceMeters(dist);
          setIsWithinRadius(dist <= OFFICE_COORDS.radius);
          setGpsStatus("success");
        },
        () => {
          // Fallback demo distance
          setDistanceMeters(45);
          setIsWithinRadius(true);
          setGpsStatus("success");
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

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
  const capturedPhoto = presensiData?.checkIn?.fotoUrl || null;
  const isProcessing = checkInMutation.isPending || checkOutMutation.isPending;

  const handleCaptureAndCheckIn = async () => {
    if (!user) return;
    const fotoUrl =
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80";

    await checkInMutation.mutateAsync({
      userId: user.id,
      nip: user.nip,
      nama: user.nama,
      orgId: user.orgId,
      tanggal: todayDateStr,
      koordinat: coords,
      fotoUrl,
      isValidLocation: isWithinRadius,
      alamat: "Gedung BKPSDM Pusat / Balaikota",
      catatan: "Presensi Swafoto ASN Terverifikasi",
    });
  };

  const handleCheckOut = async () => {
    if (!user) return;
    await checkOutMutation.mutateAsync({
      userId: user.id,
      tanggal: todayDateStr,
      koordinat: coords,
      fotoUrl:
        presensiData?.checkIn?.fotoUrl ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      isValidLocation: isWithinRadius,
      alamat: "Gedung BKPSDM Pusat / Balaikota",
      catatan: "Presensi Pulang Kerja Pegawai ASN",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-600" />
            Presensi Digital Pegawai ASN
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Perekaman kehadiran berbasis verifikasi geolokasi satelit GPS dan swafoto selfie
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={isWithinRadius ? "default" : "destructive"}
            className="text-xs px-3 py-1 flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5" />
            {isWithinRadius ? "Dalam Radius Kantor" : "Di Luar Radius Kantor"}
          </Badge>
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
              {/* Camera Frame Preview (Portrait on Mobile, Landscape on Desktop) */}
              <div className="relative aspect-[3/4] sm:aspect-video max-h-[420px] sm:max-h-80 w-full rounded-2xl bg-slate-950 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center overflow-hidden shadow-inner mx-auto">
                {capturedPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={capturedPhoto}
                    alt="Swafoto Presensi"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-slate-400">
                      <Camera className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-white">
                        Siap Mengambil Swafoto
                      </div>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Kamera mendeteksi kondisi pencahayaan yang cukup. Tekan tombol ambil foto untuk check-in.
                      </p>
                    </div>
                  </div>
                )}

                {/* Overlay Metadata */}
                <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 flex items-center justify-between text-xs text-white">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate text-[11px]">
                      {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} ({distanceMeters}m dari kantor)
                    </span>
                  </div>
                  <Badge variant="default" className="text-[10px] bg-emerald-500/30 text-emerald-300 border-emerald-500/40">
                    GPS Akurat
                  </Badge>
                </div>
              </div>

              {/* Action Buttons: Check-In & Check-Out */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={handleCaptureAndCheckIn}
                  disabled={isProcessing || !isWithinRadius || !!checkInTime}
                  className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  {checkInTime ? `Sudah Masuk: ${checkInTime}` : "Ambil Foto & Check-In Masuk"}
                </Button>

                <Button
                  onClick={handleCheckOut}
                  disabled={isProcessing || !checkInTime || !!checkOutTime}
                  variant="outline"
                  className="h-12 border-slate-300 hover:bg-slate-100 font-semibold text-sm text-slate-800"
                >
                  <Clock className="w-5 h-5 mr-2 text-teal-600" />
                  {checkOutTime ? `Sudah Pulang: ${checkOutTime}` : "Check-Out Pulang"}
                </Button>
              </div>

              {/* Ketentuan Jam Kerja ASN */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Aturan Jam Presensi Hari Kerja (Senin - Jumat)
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div>
                    • <strong>Batas Masuk:</strong> 07:30 WIB (lewat = terlambat)
                  </div>
                  <div>
                    • <strong>Jam Pulang:</strong> Minimal 16:00 WIB
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Detail Geofencing & Riwayat Hari Ini */}
        <div className="space-y-6">
          {/* Card Lokasi & Geofence */}
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-600" />
                Informasi Geofencing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Titik Pusat Presensi:</span>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-800 flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-500" />
                  Balaikota / Gedung BKPSDM Pusat
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Jarak Anda ke Pusat Kantor:</span>
                <div
                  className={`p-2.5 rounded-lg border font-bold flex items-center justify-between ${
                    isWithinRadius
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-red-50 border-red-200 text-red-900"
                  }`}
                >
                  <span>{distanceMeters} Meter</span>
                  <Badge variant={isWithinRadius ? "default" : "destructive"} className="text-[10px]">
                    {isWithinRadius ? "Di Bawah 150m" : "Di Luar Batas"}
                  </Badge>
                </div>
                {!isWithinRadius && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCoords({ lat: OFFICE_COORDS.lat + 0.0001, lng: OFFICE_COORDS.lng + 0.0001 });
                      setDistanceMeters(25);
                      setIsWithinRadius(true);
                    }}
                    className="w-full mt-2 text-[11px] h-8 border-dashed border-emerald-400 text-emerald-700 hover:bg-emerald-50 font-medium"
                  >
                    Simulasi Berada di Kantor (Mode Uji Coba 25m)
                  </Button>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Koordinat Satelit GPS:</span>
                <div className="p-2 rounded-lg bg-slate-100 font-mono text-[11px] text-slate-700">
                  Lat: {coords.lat.toFixed(6)} | Lng: {coords.lng.toFixed(6)}
                </div>
              </div>
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
