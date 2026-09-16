"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePresensiHarian, useCheckInMutation, useCheckOutMutation } from "@/hooks/usePresensi";
import { useKantorList } from "@/hooks/useKantor";
import { DEFAULT_KANTOR_LIST, calculateHaversineDistance, detectNearestOffice } from "@/data/masterKantor";
import { KantorUnit } from "@/types";
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
  ChevronDown,
  Compass,
  Check,
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

  // Mode deteksi kantor: "auto" atau id kantor tertentu
  const [selectedKantorMode, setSelectedKantorMode] = useState<string>("auto");

  // Koordinat default awal (Solo Teknopark)
  const defaultCoords = DEFAULT_KANTOR_LIST[0].koordinat;
  const [gpsStatus, setGpsStatus] = useState<"locating" | "success" | "simulated">("locating");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: defaultCoords.lat,
    lng: defaultCoords.lng,
  });

  useEffect(() => {
    // Ambil GPS aktual pengguna jika diizinkan browser
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setGpsStatus("success");
        },
        () => {
          // Fallback demo: koordinat default Solo Teknopark
          setCoords({
            lat: defaultCoords.lat + 0.0001,
            lng: defaultCoords.lng + 0.0001,
          });
          setGpsStatus("simulated");
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [defaultCoords.lat, defaultCoords.lng]);

  // Perhitungan jarak untuk semua kantor
  const nearestResult = useMemo(() => {
    return detectNearestOffice(coords, kantorList);
  }, [coords, kantorList]);

  // Tentukan kantor aktif berdasarkan mode pemilihan
  const activeOffice: KantorUnit = useMemo(() => {
    if (selectedKantorMode === "auto") {
      return nearestResult.nearestOffice;
    }
    const found = kantorList.find((k) => k.id === selectedKantorMode);
    return found || nearestResult.nearestOffice;
  }, [selectedKantorMode, kantorList, nearestResult.nearestOffice]);

  // Hitung jarak ke kantor aktif
  const currentDistance = useMemo(() => {
    return calculateHaversineDistance(coords, activeOffice.koordinat);
  }, [coords, activeOffice]);

  const isWithinRadius = currentDistance <= activeOffice.radiusMeter;

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
      kantorId: activeOffice.id,
      namaKantor: activeOffice.namaKantor,
      jarakMeter: currentDistance,
      koordinat: coords,
      fotoUrl,
      isValidLocation: isWithinRadius,
      alamat: activeOffice.alamat,
      catatan: `Presensi Swafoto ASN di ${activeOffice.namaKantor}`,
    });
  };

  const handleCheckOut = async () => {
    if (!user) return;
    await checkOutMutation.mutateAsync({
      userId: user.id,
      tanggal: todayDateStr,
      kantorId: activeOffice.id,
      namaKantor: activeOffice.namaKantor,
      jarakMeter: currentDistance,
      koordinat: coords,
      fotoUrl:
        presensiData?.checkIn?.fotoUrl ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      isValidLocation: isWithinRadius,
      alamat: activeOffice.alamat,
      catatan: `Presensi Pulang Kerja ASN di ${activeOffice.namaKantor}`,
    });
  };

  const handleSimulasiLokasi = (kantor: KantorUnit) => {
    // Beri offset sedikit (sekitar 15 meter di dalam radius)
    setCoords({
      lat: kantor.koordinat.lat + 0.00008,
      lng: kantor.koordinat.lng + 0.00008,
    });
    setSelectedKantorMode(kantor.id);
    setGpsStatus("simulated");
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
            Perekaman kehadiran multi-kantor berbasis satelit GPS dan verifikasi swafoto ASN
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector Kantor Target */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-sm text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 font-medium">Target Kantor:</span>
            <select
              value={selectedKantorMode}
              onChange={(e) => setSelectedKantorMode(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 text-xs focus:outline-none cursor-pointer"
            >
              <option value="auto">📍 Auto Terdekat ({nearestResult.nearestOffice.kodeKantor})</option>
              {kantorList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.namaKantor} ({k.kategori})
                </option>
              ))}
            </select>
          </div>

          <Badge
            variant={isWithinRadius ? "default" : "destructive"}
            className="text-xs px-3 py-1 flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5" />
            {isWithinRadius ? `Dalam Radius ${activeOffice.radiusMeter}m` : "Di Luar Radius Kantor"}
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
              {/* Camera Frame Preview */}
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
                        Kamera siap merekam bukti kehadiran. Presensi akan dicatat pada lokasi kantor{" "}
                        <strong className="text-emerald-400">{activeOffice.namaKantor}</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {/* Overlay Metadata */}
                <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 flex items-center justify-between text-xs text-white">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate text-[11px]">
                      {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} ({currentDistance}m ke {activeOffice.kodeKantor})
                    </span>
                  </div>
                  <Badge variant="default" className="text-[10px] bg-emerald-500/30 text-emerald-300 border-emerald-500/40">
                    {gpsStatus === "simulated" ? "Simulasi Lokasi" : "GPS Satelit"}
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
                <div
                  className={`p-2.5 rounded-lg border font-bold flex items-center justify-between ${
                    isWithinRadius
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-red-50 border-red-200 text-red-900"
                  }`}
                >
                  <span>{currentDistance} Meter</span>
                  <Badge variant={isWithinRadius ? "default" : "destructive"} className="text-[10px]">
                    {isWithinRadius ? `Maksimal ${activeOffice.radiusMeter}m (Valid)` : `Di Luar ${activeOffice.radiusMeter}m`}
                  </Badge>
                </div>
                {!isWithinRadius && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSimulasiLokasi(activeOffice)}
                    className="w-full mt-2 text-[11px] h-8 border-dashed border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-medium"
                  >
                    Simulasi Berada di {activeOffice.kodeKantor} (~15m)
                  </Button>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Koordinat GPS Anda:</span>
                <div className="p-2 rounded-lg bg-slate-100 font-mono text-[11px] text-slate-700">
                  Lat: {coords.lat.toFixed(6)} | Lng: {coords.lng.toFixed(6)}
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
                Pilih atau klik simulasi untuk mencoba presensi di lokasi kantor lain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {nearestResult.allOfficesWithDistance.map(({ office, distanceMeters, isWithinRadius: inRad }) => {
                const isCurrentActive = office.id === activeOffice.id;
                return (
                  <div
                    key={office.id}
                    className={`p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                      isCurrentActive
                        ? "bg-teal-50/70 border-teal-300 ring-1 ring-teal-400"
                        : "bg-slate-50/80 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="space-y-0.5 max-w-[65%]">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5 truncate">
                        {isCurrentActive && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                        <span className="truncate">{office.namaKantor}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-slate-300">
                          {office.kodeKantor}
                        </Badge>
                        <span>• Jarak: {distanceMeters}m</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSimulasiLokasi(office)}
                        className="h-7 text-[10px] px-2 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 font-medium"
                      >
                        Pindah Sini
                      </Button>
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
