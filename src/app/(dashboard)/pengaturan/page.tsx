"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useKantorList, useSaveKantorMutation, useDeleteKantorMutation } from "@/hooks/useKantor";
import { DEFAULT_KANTOR_LIST } from "@/data/masterKantor";
import { KantorUnit, KategoriKantor } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Compass,
  Clock,
  RotateCcw,
  Pencil,
} from "lucide-react";

import { seedDatabaseAction } from "@/actions/seed";
import MobilePageHeader from "@/components/dashboard/MobilePageHeader";
import dynamic from "next/dynamic";

// Dynamic import dengan SSR: false untuk memastikan Leaflet hanya dimuat di client-side (Zero SSR Crash)
const OfficeLocationPicker = dynamic(
  () => import("@/components/maps/OfficeLocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[360px] rounded-xl bg-slate-900/5 border border-slate-200 animate-pulse flex items-center justify-center text-xs text-slate-500">
        Memuat peta interaktif Leaflet OpenStreetMap...
      </div>
    ),
  }
);

const OfficeOverviewMap = dynamic(
  () => import("@/components/maps/OfficeOverviewMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[320px] rounded-xl bg-slate-900/5 border border-slate-200 animate-pulse flex items-center justify-center text-xs text-slate-500">
        Memuat peta sebaran kantor Surakarta...
      </div>
    ),
  }
);

export default function PengaturanKantorPage() {
  const { user } = useAuth();
  const { data: kantorListFromDb, isLoading, refetch } = useKantorList(user?.orgId);
  const saveKantorMutation = useSaveKantorMutation();
  const deleteKantorMutation = useDeleteKantorMutation();
  const [isSeeding, setIsSeeding] = useState(false);

  const offices: KantorUnit[] = kantorListFromDb || [];

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    kodeKantor: string;
    namaKantor: string;
    kategori: KategoriKantor;
    alamat: string;
    lat: string;
    lng: string;
    radiusMeter: number;
    jamMasukMaksimal: string;
    jamPulangMinimal: string;
  }>({
    kodeKantor: "",
    namaKantor: "",
    kategori: "OPD / Dinas",
    alamat: "",
    lat: "-7.558392",
    lng: "110.857528",
    radiusMeter: 200,
    jamMasukMaksimal: "07:30",
    jamPulangMinimal: "16:00",
  });

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    try {
      const res = await seedDatabaseAction();
      setStatusMessage(res.message);
      await refetch();
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsSeeding(false);
    }
  };


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "radiusMeter" ? Number(value) : value,
    }));
  };

  const handleSubmitNewKantor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kodeKantor || !formData.namaKantor || !formData.alamat) {
      alert("Harap lengkapi kode kantor, nama, dan alamat!");
      return;
    }

    const newKantor: KantorUnit = {
      id: editingId || `kantor-${Date.now()}`,
      kodeKantor: formData.kodeKantor.toUpperCase(),
      namaKantor: formData.namaKantor,
      kategori: formData.kategori,
      alamat: formData.alamat,
      koordinat: {
        lat: parseFloat(formData.lat) || -7.568500,
        lng: parseFloat(formData.lng) || 110.828000,
      },
      radiusMeter: Number(formData.radiusMeter) || 150,
      jamMasukMaksimal: formData.jamMasukMaksimal || "07:30",
      jamPulangMinimal: formData.jamPulangMinimal || "16:00",
      orgId: user?.orgId || "org-surakarta",
      isActive: true,
    };

    await saveKantorMutation.mutateAsync(newKantor);
    setStatusMessage(editingId ? `Titik kantor "${newKantor.namaKantor}" berhasil diperbarui!` : `Titik kantor "${newKantor.namaKantor}" berhasil ditambahkan!`);
    setShowAddForm(false);
    setEditingId(null);
    setFormData({
      kodeKantor: "",
      namaKantor: "",
      kategori: "OPD / Dinas",
      alamat: "",
      lat: "-7.568500",
      lng: "110.828000",
      radiusMeter: 150,
      jamMasukMaksimal: "07:30",
      jamPulangMinimal: "16:00",
    });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleEditClick = (kantor: KantorUnit) => {
    setEditingId(kantor.id);
    setFormData({
      kodeKantor: kantor.kodeKantor,
      namaKantor: kantor.namaKantor,
      kategori: kantor.kategori,
      alamat: kantor.alamat,
      lat: (kantor.koordinat?.lat ?? -7.558392).toString(),
      lng: (kantor.koordinat?.lng ?? 110.857528).toString(),
      radiusMeter: kantor.radiusMeter || 150,
      jamMasukMaksimal: kantor.jamMasukMaksimal || "07:30",
      jamPulangMinimal: kantor.jamPulangMinimal || "16:00",
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus atau menonaktifkan kantor "${nama}"?`)) {
      await deleteKantorMutation.mutateAsync(id);
      setStatusMessage(`Titik kantor "${nama}" telah dihapus.`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleToggleStatus = async (kantor: KantorUnit) => {
    const updated = { ...kantor, isActive: !kantor.isActive };
    await saveKantorMutation.mutateAsync(updated);
  };

  return (
    <div className="space-y-6">
      {/* Contextual Mobile Back Header */}
      <MobilePageHeader
        title="Pengaturan Kantor & Geofence"
        subtitle="Manajemen titik koordinat GPS & radius kantor dinas"
      />

      {/* Header Halaman (Desktop) */}
      <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            Manajemen Titik Multi-Kantor Geofencing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi koordinat GPS satelit, batas radius geofence, dan jam kerja unit dinas ASN
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSeedDemoData}
            disabled={isSeeding}
            className="btn-outline btn-sm text-xs font-medium"
          >
            <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isSeeding ? "animate-spin" : ""}`} />
            {isSeeding ? "Menyuntikkan Seed..." : "Reset & Inisialisasi Seed Demo (Kantor Pusat)"}
          </Button>

          <Button
            onClick={() => {
              if (showAddForm) {
                setShowAddForm(false);
                setEditingId(null);
                setFormData({
                  kodeKantor: "",
                  namaKantor: "",
                  kategori: "OPD / Dinas",
                  alamat: "",
                  lat: "-7.568500",
                  lng: "110.828000",
                  radiusMeter: 150,
                  jamMasukMaksimal: "07:30",
                  jamPulangMinimal: "16:00",
                });
              } else {
                setShowAddForm(true);
              }
            }}
            className="btn-primary btn-sm text-xs font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {showAddForm ? "Tutup Form" : "Tambah Titik Kantor Baru"}
          </Button>
        </div>
      </div>

      {/* Alert Status */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Statistik Ringkas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-[11px] text-slate-500 font-medium">Total Titik Kantor</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{offices.length}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Tersebar di wilayah kerja</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] text-slate-500 font-medium">Kantor Aktif</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {offices.filter((k) => k.isActive).length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Menerima presensi online</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] text-slate-500 font-medium">Radius Geofence Default</div>
          <div className="text-2xl font-bold text-teal-600 mt-1">150m</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Toleransi akurasi GPS</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] text-slate-500 font-medium">Auto-Detection</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">Haversine</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Kalkulasi presisi koordinat</div>
        </Card>
      </div>

      {/* Form Tambah Kantor Baru */}
      {showAddForm && (
        <Card className="border-emerald-200 bg-emerald-50/20">
          <CardHeader className="pb-3 border-b border-emerald-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-600" />
              {editingId ? "Edit Titik Lokasi Kantor" : "Pendaftaran Titik Lokasi Kantor Baru"}
            </CardTitle>
            <CardDescription className="text-xs text-slate-600">
              Pastikan koordinat Latitude dan Longitude bersumber dari titik resmi Google Maps / Satelit GPS
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleSubmitNewKantor} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="kodeKantor" className="text-xs text-slate-700">Kode Kantor (Singkatan)</Label>
                  <Input
                    id="kodeKantor"
                    name="kodeKantor"
                    placeholder="misal: DISDIK-01"
                    value={formData.kodeKantor}
                    onChange={handleInputChange}
                    className="bg-white"
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="namaKantor" className="text-xs text-slate-700">Nama Lengkap Kantor / Instansi OPD</Label>
                  <Input
                    id="namaKantor"
                    name="namaKantor"
                    placeholder="misal: Dinas Pendidikan Kota Surakarta"
                    value={formData.namaKantor}
                    onChange={handleInputChange}
                    className="bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="kategori" className="text-xs text-slate-700">Kategori Kantor</Label>
                  <select
                    id="kategori"
                    name="kategori"
                    value={formData.kategori}
                    onChange={handleInputChange}
                    className="w-full h-10 px-3 py-2 text-xs rounded-md border border-slate-300 bg-white focus:outline-none"
                  >
                    <option value="Pusat">Pusat / Balai Kota</option>
                    <option value="OPD / Dinas">OPD / Dinas</option>
                    <option value="Kecamatan">Kecamatan</option>
                    <option value="Kelurahan">Kelurahan</option>
                    <option value="UPTD / Sekolah">UPTD / Sekolah</option>
                    <option value="Kawasan Khusus">Kawasan Khusus</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="radiusMeter" className="text-xs text-slate-700 font-semibold">
                      Radius Geofence: <span className="text-emerald-700 font-bold">{formData.radiusMeter} Meter</span>
                    </Label>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="500"
                    step="10"
                    value={formData.radiusMeter}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        radiusMeter: Number(e.target.value),
                      }))
                    }
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>30m (Ketat)</span>
                    <span>150m (Standar)</span>
                    <span>500m (Luas)</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-700">Batas Jam Masuk & Pulang</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      name="jamMasukMaksimal"
                      value={formData.jamMasukMaksimal}
                      onChange={handleInputChange}
                      placeholder="07:30"
                      className="bg-white text-center"
                    />
                    <Input
                      name="jamPulangMinimal"
                      value={formData.jamPulangMinimal}
                      onChange={handleInputChange}
                      placeholder="16:00"
                      className="bg-white text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Peta Interaktif Leaflet Penentu Titik Koordinat & Radius */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-slate-700 font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    Peta Interaktif Penentu Titik & Lingkaran Geofence
                  </Label>
                  <span className="text-[10px] text-slate-500">
                    Geser pin hijau atau klik peta untuk menaruh titik kantor
                  </span>
                </div>
                <OfficeLocationPicker
                  initialLat={parseFloat(formData.lat) || -7.558392}
                  initialLng={parseFloat(formData.lng) || 110.857528}
                  radiusMeter={formData.radiusMeter}
                  namaKantor={formData.namaKantor || "Titik Kantor Baru"}
                  onChange={(newLat, newLng) => {
                    setFormData((prev) => ({
                      ...prev,
                      lat: newLat.toString(),
                      lng: newLng.toString(),
                    }));
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="lat" className="text-xs text-slate-700">Latitude GPS (Terisi Otomatis)</Label>
                  <Input
                    id="lat"
                    name="lat"
                    placeholder="-7.568500"
                    value={formData.lat}
                    onChange={handleInputChange}
                    className="bg-white font-mono font-semibold text-slate-800"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lng" className="text-xs text-slate-700">Longitude GPS (Terisi Otomatis)</Label>
                  <Input
                    id="lng"
                    name="lng"
                    placeholder="110.828000"
                    value={formData.lng}
                    onChange={handleInputChange}
                    className="bg-white font-mono font-semibold text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="alamat" className="text-xs text-slate-700">Alamat Lengkap</Label>
                <Input
                  id="alamat"
                  name="alamat"
                  placeholder="Jl. ..., Kelurahan ..., Kecamatan ..., Kota ..."
                  value={formData.alamat}
                  onChange={handleInputChange}
                  className="bg-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                    setFormData({
                      kodeKantor: "",
                      namaKantor: "",
                      kategori: "OPD / Dinas",
                      alamat: "",
                      lat: "-7.568500",
                      lng: "110.828000",
                      radiusMeter: 150,
                      jamMasukMaksimal: "07:30",
                      jamPulangMinimal: "16:00",
                    });
                  }}
                  className="btn-outline btn-sm text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={saveKantorMutation.isPending}
                  className="btn-primary btn-sm text-xs font-semibold"
                >
                  {editingId ? "Simpan Perubahan" : "Simpan Titik Kantor"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Peta Sebaran Makro Geofence Seluruh Kantor ASN */}
      <OfficeOverviewMap offices={offices} />

      {/* Tabel Daftar Seluruh Titik Kantor */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-200/80 py-4 px-6">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-600" />
            Daftar Seluruh Titik Geofence Unit Kerja ASN ({offices.length})
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Setiap ASN yang berada di dalam radius masing-masing kantor ini dapat melakukan presensi terverifikasi
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Kode & Nama Kantor</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Koordinat GPS Satelit</th>
                  <th className="py-3 px-4">Radius</th>
                  <th className="py-3 px-4">Jam Kerja</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offices.map((kantor) => (
                  <tr key={kantor.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-300 font-mono">
                          {kantor.kodeKantor}
                        </Badge>
                        <span>{kantor.namaKantor}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {kantor.alamat}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant="secondary" className="text-[10px]">
                        {kantor.kategori}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>
                          {kantor.koordinat?.lat != null ? kantor.koordinat.lat.toFixed(6) : "-"},{" "}
                          {kantor.koordinat?.lng != null ? kantor.koordinat.lng.toFixed(6) : "-"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-emerald-700">{kantor.radiusMeter}m</span>
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{kantor.jamMasukMaksimal || "07:30"} - {kantor.jamPulangMinimal || "16:00"}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(kantor)}
                        className="cursor-pointer"
                        title="Klik untuk mengubah status"
                      >
                        <Badge
                          variant={kantor.isActive ? "default" : "destructive"}
                          className="text-[10px]"
                        >
                          {kantor.isActive ? "Aktif" : "Non-Aktif"}
                        </Badge>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditClick(kantor)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          title="Edit Kantor"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(kantor.id, kantor.namaKantor)}
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Hapus Kantor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
