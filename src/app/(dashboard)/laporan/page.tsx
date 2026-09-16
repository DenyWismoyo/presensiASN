"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { LKHItem, LKHStatus } from "@/types";
import { useLKHHarian, useSaveLKHMutation, useSubmitLKHMutation } from "@/hooks/useLKH";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn, formatBytes } from "@/lib/utils";
import StorageMeter from "@/components/dashboard/StorageMeter";
import KinerjaTrackerCard from "@/components/logbook/KinerjaTrackerCard";
import AktivitasCombobox from "@/components/logbook/AktivitasCombobox";
import LogbookDateStrip from "@/components/logbook/LogbookDateStrip";
import FileUploadInput from "@/components/logbook/FileUploadInput";
import { UploadedFileMetadata } from "@/types";
import { playSuccessChime } from "@/lib/sound";
import MobilePageHeader from "@/components/dashboard/MobilePageHeader";
import {
  AktivitasASN,
  TARGET_POIN_HARIAN,
  detectAktivitasFromLogbookText,
  getAktivitasSoloById,
} from "@/data/masterAktivitas";
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  UploadCloud,
  CheckCircle2,
  Clock,
  Send,
  FileText,
  Image as ImageIcon,
  CheckCheck,
  AlertCircle,
  HardDrive,
  FolderArchive,
  Sparkles,
  Zap,
  BookOpen,
  Calendar,
  Save,
  Loader2,
} from "lucide-react";

interface SavedAttachment {
  id: string;
  name: string;
  sizeBytes: number;
  type: "foto" | "dokumen";
  url: string;
  uploadedAt: string;
  kegiatanTitle: string;
}

export default function LaporanPage() {
  const { user, consumeStorage, releaseStorage } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [lkhStatus, setLkhStatus] = useState<LKHStatus>("draft");
  const [activeTab, setActiveTab] = useState<"form" | "list" | "files">("form");
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null);

  const selectedDateStr = useMemo(() => {
    return selectedDate.toISOString().split("T")[0];
  }, [selectedDate]);

  // Integrasi data realtime Firestore via TanStack Query
  const { data: serverLKH, isLoading: isLKHLoading } = useLKHHarian(user?.id, selectedDateStr);
  const saveLKHMutation = useSaveLKHMutation();
  const submitLKHMutation = useSubmitLKHMutation();

  // Sinkronisasi data Firestore jika record tanggal tersebut sudah tersimpan
  useEffect(() => {
    if (serverLKH) {
      setKegiatanList(serverLKH.kegiatan || []);
      setLkhStatus(serverLKH.status || "draft");
    } else {
      setKegiatanList([]);
      setLkhStatus("draft");
    }
  }, [serverLKH]);

  // Daftar Kegiatan Harian (dimuat secara riil dari server/Firestore)
  const [kegiatanList, setKegiatanList] = useState<LKHItem[]>([]);

  // Total Poin Harian Terakumulasi
  const totalPoinHarian = useMemo(() => {
    return kegiatanList.reduce((acc, item) => acc + (item.totalPoin || 0), 0);
  }, [kegiatanList]);

  const isApproved = lkhStatus === "approved";
  const isSubmitted = lkhStatus === "submitted";
  const isRejected = lkhStatus === "rejected";
  const canEdit = lkhStatus === "draft" || isRejected;

  // Daftar berkas yang tersimpan di cloud storage 1 GB ASN
  const [savedFiles, setSavedFiles] = useState<SavedAttachment[]>([]);


  // Form input baru
  const [selectedAktivitas, setSelectedAktivitas] = useState<AktivitasASN | null>(null);
  const [deskripsi, setDeskripsi] = useState("");
  const [outputKegiatan, setOutputKegiatan] = useState("");
  const [volumeKegiatan, setVolumeKegiatan] = useState(1);
  const [satuanKegiatan, setSatuanKegiatan] = useState("Per kegiatan");
  const [jamMulai, setJamMulai] = useState("08:00");
  const [jamSelesai, setJamSelesai] = useState("10:00");
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  // Handler untuk foto yang berhasil diupload ke Firebase Storage
  const handleFotoUploaded = (metadata: UploadedFileMetadata) => {
    setUploadedPhotos([...uploadedPhotos, metadata.url]);
    // Catat penggunaan storage
    consumeStorage(metadata.sizeBytes);
    // Tambahkan ke daftar berkas tersimpan
    const newSaved: SavedAttachment = {
      id: metadata.id,
      name: metadata.name,
      sizeBytes: metadata.sizeBytes,
      type: "foto",
      url: metadata.url,
      uploadedAt: "Baru saja",
      kegiatanTitle: deskripsi || selectedAktivitas?.nama || "Draft Kegiatan",
    };
    setSavedFiles([newSaved, ...savedFiles]);
  };

  // Handler untuk dokumen yang berhasil diupload ke Firebase Storage
  const handleDokumenUploaded = (metadata: UploadedFileMetadata) => {
    setUploadedFiles([...uploadedFiles, metadata.name]);
    consumeStorage(metadata.sizeBytes);
    const newSaved: SavedAttachment = {
      id: metadata.id,
      name: metadata.name,
      sizeBytes: metadata.sizeBytes,
      type: "dokumen",
      url: metadata.url,
      uploadedAt: "Baru saja",
      kegiatanTitle: deskripsi || selectedAktivitas?.nama || "Draft Kegiatan",
    };
    setSavedFiles([newSaved, ...savedFiles]);
  };

  // Deteksi Cerdas Aktivitas dari Uraian Teks
  const detectedAktivitas = useMemo(() => {
    if (!deskripsi || deskripsi.length < 4) return null;
    const detected = detectAktivitasFromLogbookText(deskripsi);
    if (detected && selectedAktivitas?.id !== detected.id) {
      return detected;
    }
    return null;
  }, [deskripsi, selectedAktivitas]);

  // Template Cepat LKH (1-Click Fill) untuk Mempercepat Pengisian Pegawai
  const QUICK_LKH_TEMPLATES = [
    {
      emoji: "👥",
      label: "Rapat Koordinasi",
      durasi: "120m",
      aktivitasId: 4,
      deskripsi: "Mengikuti rapat koordinasi internal pembahasan tindak lanjut program kerja dan arahan pimpinan.",
      output: "Notula Rapat",
      jamMulai: "09:00",
      jamSelesai: "11:00",
    },
    {
      emoji: "🏢",
      label: "Pelayanan Publik",
      durasi: "60m",
      aktivitasId: 3,
      deskripsi: "Memberikan pelayanan konsultasi dan pemrosesan permohonan administrasi kepada masyarakat.",
      output: "Laporan Pelayanan",
      jamMulai: "08:00",
      jamSelesai: "09:00",
    },
    {
      emoji: "📝",
      label: "Penyusunan Laporan",
      durasi: "60m",
      aktivitasId: 41,
      deskripsi: "Menyusun dan merumuskan laporan hasil kegiatan kedinasan beserta dokumentasi pendukung.",
      output: "Dokumen Laporan",
      jamMulai: "13:00",
      jamSelesai: "14:00",
    },
    {
      emoji: "💻",
      label: "Input & Verifikasi Data",
      durasi: "60m",
      aktivitasId: 32,
      deskripsi: "Melakukan verifikasi berkas administrasi dan penginputan data ke dalam sistem basis data instansi.",
      output: "Data Terverifikasi",
      jamMulai: "10:00",
      jamSelesai: "11:00",
    },
    {
      emoji: "🔍",
      label: "Tugas Pengawasan",
      durasi: "120m",
      aktivitasId: 2,
      deskripsi: "Melaksanakan tugas monitoring, pengawasan lapangan, dan kesiapsiagaan sarana prasarana dinas.",
      output: "Laporan Pengawasan",
      jamMulai: "14:00",
      jamSelesai: "16:00",
    },
  ];

  const handleApplyTemplate = (tmpl: typeof QUICK_LKH_TEMPLATES[number]) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(20);
      } catch {}
    }
    const akt = getAktivitasSoloById(tmpl.aktivitasId);
    if (akt) {
      setSelectedAktivitas(akt);
      setSatuanKegiatan(akt.satuan);
    }
    setDeskripsi(tmpl.deskripsi);
    setOutputKegiatan(tmpl.output);
    setJamMulai(tmpl.jamMulai);
    setJamSelesai(tmpl.jamSelesai);
    setVolumeKegiatan(1);
  };

  const handleSelectAktivitas = (item: AktivitasASN) => {
    setSelectedAktivitas(item);
    setSatuanKegiatan(item.satuan);
    if (!outputKegiatan) {
      setOutputKegiatan(`Dokumen / Bukti ${item.nama}`);
    }
  };

  const handleApplyDetected = (item: AktivitasASN) => {
    handleSelectAktivitas(item);
  };


  const handleHapusFileStorage = (fileId: string, sizeBytes: number) => {
    releaseStorage(sizeBytes);
    setSavedFiles(savedFiles.filter((f) => f.id !== fileId));
    setQuotaWarning(null);
  };

  const handleTambahKegiatan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deskripsi) return;

    const nilaiPoin = selectedAktivitas?.nilaiPoin || 50;
    const totalPoin = volumeKegiatan * nilaiPoin;

    const newItem: LKHItem = {
      id: `keg-${Date.now()}`,
      aktivitasId: selectedAktivitas?.id,
      namaAktivitasBaku: selectedAktivitas?.nama,
      kategoriAktivitas: selectedAktivitas?.kategori || "Umum",
      deskripsi,
      outputKegiatan: outputKegiatan || "Hasil Pelaksanaan Tugas",
      volumeKegiatan,
      satuanKegiatan,
      jamMulai,
      jamSelesai,
      nilaiPoin,
      totalPoin,
      lampiranFotoUrls: uploadedPhotos,
      lampiranDokumenUrls: uploadedFiles,
    };

    setKegiatanList([...kegiatanList, newItem]);
    setDeskripsi("");
    setOutputKegiatan("");
    setVolumeKegiatan(1);
    setSelectedAktivitas(null);
    setUploadedPhotos([]);
    setUploadedFiles([]);
    setActiveTab("list");
    playSuccessChime();
  };

  const handleHapusKegiatan = (id: string) => {
    setKegiatanList(kegiatanList.filter((item) => item.id !== id));
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    await saveLKHMutation.mutateAsync({
      userId: user.id,
      nip: user.nip,
      nama: user.nama,
      orgId: user.orgId,
      tanggal: selectedDateStr,
      kegiatan: kegiatanList,
      status: "draft",
    });
    playSuccessChime();
  };

  const handleSubmitLKH = async () => {
    if (!user) return;
    // Simpan draf terlebih dahulu
    await saveLKHMutation.mutateAsync({
      userId: user.id,
      nip: user.nip,
      nama: user.nama,
      orgId: user.orgId,
      tanggal: selectedDateStr,
      kegiatan: kegiatanList,
      status: "draft",
    });
    // Ajukan ke atasan
    await submitLKHMutation.mutateAsync({
      userId: user.id,
      tanggal: selectedDateStr,
    });
    setLkhStatus("submitted");
    playSuccessChime();
  };

  return (
    <div className="space-y-6">
      {/* Contextual Mobile Back Header */}
      <MobilePageHeader
        title="Logbook Kinerja Harian"
        subtitle="Pelaporan tugas dinas & pemenuhan 300 poin SKP"
      />

      {/* Header Halaman (Desktop) */}
      <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-teal-600" />
            Logbook Kegiatan & Kinerja Harian ASN
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Integrasi <strong>152 Master Aktivitas Resmi</strong>, kalkulasi bobot poin, dan alokasi <strong>1 GB Storage</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant={
              isApproved
                ? "default"
                : isSubmitted
                ? "warning"
                : isRejected
                ? "destructive"
                : "secondary"
            }
            className="text-xs px-3 py-1"
          >
            Status: {
              isApproved
                ? "Disetujui"
                : isSubmitted
                ? "Menunggu Persetujuan Atasan"
                : isRejected
                ? "Dikembalikan (Perbaikan)"
                : "Draf"
            }
          </Badge>

          {/* Tombol Simpan Draf ke Cloud */}
          {canEdit && (
            <Button
              onClick={handleSaveDraft}
              disabled={saveLKHMutation.isPending}
              variant="outline"
              className="border-slate-300 hover:bg-slate-100 text-slate-700 text-xs h-9 font-semibold"
            >
              {saveLKHMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-teal-600" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
              )}
              Simpan Draf
            </Button>
          )}

          {canEdit && kegiatanList.length > 0 && (
            <Button
              onClick={handleSubmitLKH}
              disabled={submitLKHMutation.isPending || saveLKHMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-semibold"
            >
              {submitLKHMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 mr-1.5" />
              )}
              {isRejected ? "Kirim Ulang ke Atasan" : "Kirim ke Atasan"}
            </Button>
          )}
        </div>
      </div>

      {/* Banner Feedback & Status Atasan Langsung */}
      {isRejected && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sm text-red-800">LKH Dikembalikan untuk Perbaikan</span>
            <p className="text-slate-700 font-medium">
              Alasan: {serverLKH?.rejectedReason || serverLKH?.catatanAtasan || "Harap lengkapi bukti atau perbaiki uraian rincian kegiatan."}
            </p>
            {serverLKH?.approvedByName && (
              <span className="text-[11px] text-slate-500 block">Pejabat Penilai: {serverLKH.approvedByName}</span>
            )}
            <p className="text-[11px] text-red-700 font-semibold mt-1">
              Silakan sesuaikan kegiatan di bawah, lalu klik &quot;Kirim Ulang ke Atasan&quot;.
            </p>
          </div>
        </div>
      )}

      {isApproved && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-semibold">LKH Telah Disetujui</span>
              {serverLKH?.approvedByName && (
                <span className="text-slate-600 ml-1">oleh {serverLKH.approvedByName}</span>
              )}
              {serverLKH?.catatanAtasan && (
                <p className="text-[11px] text-emerald-800 mt-0.5">&ldquo;{serverLKH.catatanAtasan}&rdquo;</p>
              )}
            </div>
          </div>
          <Badge variant="default" className="bg-emerald-600 text-white text-[11px]">
            SKP Sah
          </Badge>
        </div>
      )}

      {isSubmitted && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            LKH sedang menunggu peninjauan dan verifikasi dari Atasan Langsung. Anda tidak dapat mengubah kegiatan selama proses review berlangsung.
          </span>
        </div>
      )}

      {/* Navigasi Tanggal Harian Logbook (Date Strip) */}
      <LogbookDateStrip
        selectedDate={selectedDate}
        onSelectDate={(date) => setSelectedDate(date)}
      />

      {/* Widget KinerjaTrackerCard (Target 300 Poin Harian) */}
      <KinerjaTrackerCard
        totalPoin={totalPoinHarian}
        targetPoin={TARGET_POIN_HARIAN}
        totalKegiatan={kegiatanList.length}
      />

      {/* Tab Switcher (Responsif Ponsel & Desktop) */}
      <div className="flex rounded-xl bg-slate-200/80 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("form")}
          className={cn(
            "flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
            activeTab === "form"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <Plus className="w-3.5 h-3.5 text-emerald-600" />
          Catat Kegiatan
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("list")}
          className={cn(
            "flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
            activeTab === "list"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <CheckCheck className="w-3.5 h-3.5 text-teal-600" />
          Daftar Tugas ({kegiatanList.length}) • {totalPoinHarian} Poin
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("files")}
          className={cn(
            "flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
            activeTab === "files"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <HardDrive className="w-3.5 h-3.5 text-blue-600" />
          Berkas Saya ({savedFiles.length})
        </button>
      </div>

      {/* Tampilan Tab 3: Galeri Berkas & Kuota 1 GB ASN */}
      {activeTab === "files" && (
        <div className="space-y-6">
          <StorageMeter />

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-emerald-600" />
                  Semua Berkas Kegiatan yang Tersimpan di Cloud
                </CardTitle>
                <CardDescription className="text-xs">
                  Kelola dan hapus berkas lampiran lama untuk membebaskan kuota 1 GB
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                Total {savedFiles.length} Berkas
              </Badge>
            </CardHeader>

            <CardContent className="space-y-2.5">
              {savedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs gap-3 hover:bg-slate-100/70 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-600">
                      {file.type === "foto" ? (
                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 truncate">
                        {file.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {file.kegiatanTitle} • {file.uploadedAt}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded-md border border-slate-200 text-[11px]">
                      {formatBytes(file.sizeBytes)}
                    </span>
                    <button
                      onClick={() => handleHapusFileStorage(file.id, file.sizeBytes)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus Berkas & Bebaskan Kuota"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grid: Form Input (Kiri) + List Kegiatan (Kanan) */}
      {activeTab !== "files" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Tambah Kegiatan (5 Cols) */}
          <div className={cn("lg:col-span-5 space-y-6", activeTab === "form" ? "block" : "hidden lg:block")}>
            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  Catat Kegiatan Baru
                </CardTitle>
                <CardDescription className="text-xs">
                  Pilih dari Kamus 152 Aktivitas atau ketik deskripsi bebas
                </CardDescription>
              </CardHeader>

              <CardContent>
                {!canEdit ? (
                  <div className="p-6 text-center space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <CheckCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">
                      {isApproved ? "LKH Telah Disetujui & Disahkan" : "LKH Sedang Dalam Proses Verifikasi"}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm mx-auto">
                      {isApproved
                        ? "Laporan Kinerja Harian pada tanggal ini sudah diverifikasi dan disahkan oleh Atasan Langsung. Penambahan atau pengeditan kegiatan dikunci permanen."
                        : "Laporan sudah dikirimkan ke Atasan Langsung. Formulir input dikunci sementara hingga ada keputusan verifikasi atau pengembalian perbaikan dari atasan."}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleTambahKegiatan} className="space-y-4">
                  {quotaWarning && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{quotaWarning}</span>
                    </div>
                  )}

                  {/* Template Cepat 1-Klik: Mobile-First Fast Fill */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-gradient-to-r from-emerald-50/70 to-teal-50/60 border border-emerald-200/80">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        Template Cepat 1-Klik ASN:
                      </span>
                      <span className="text-[10px] text-emerald-700 font-medium">Sentuh untuk isi cepat</span>
                    </div>

                    <div className="flex gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none -mx-1 px-1">
                      {QUICK_LKH_TEMPLATES.map((tmpl) => (
                        <button
                          key={tmpl.label}
                          type="button"
                          onClick={() => handleApplyTemplate(tmpl)}
                          className="shrink-0 px-2.5 py-1.5 rounded-lg bg-white hover:bg-emerald-100/70 text-slate-800 hover:text-emerald-900 border border-emerald-200/90 text-[11px] font-medium transition-all active:scale-95 flex items-center gap-1.5 shadow-2xs group"
                        >
                          <span className="text-xs group-hover:scale-110 transition-transform">{tmpl.emoji}</span>
                          <span className="font-semibold">{tmpl.label}</span>
                          <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100/80 px-1 py-0.2 rounded">
                            {tmpl.durasi}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selector Kamus 152 Master Aktivitas */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                        Kamus 152 Aktivitas Resmi ASN
                      </Label>
                      {selectedAktivitas && (
                        <span className="text-[10px] text-emerald-700 font-bold">
                          +{selectedAktivitas.nilaiPoin} Poin / {selectedAktivitas.satuan}
                        </span>
                      )}
                    </div>
                    <AktivitasCombobox
                      selectedAktivitasId={selectedAktivitas?.id}
                      onSelect={handleSelectAktivitas}
                    />
                  </div>

                  {/* Smart Auto-Detection Banner */}
                  {detectedAktivitas && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300/80 text-emerald-950 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="truncate">
                          <span className="text-[10px] text-emerald-700 block font-medium">
                            💡 Deteksi Cerdas Sistem:
                          </span>
                          <span className="font-semibold truncate block">
                            #{detectedAktivitas.id} {detectedAktivitas.nama} (+{detectedAktivitas.nilaiPoin} Poin)
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleApplyDetected(detectedAktivitas)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-2.5 shrink-0"
                      >
                        Terapkan
                      </Button>
                    </div>
                  )}

                  {/* Deskripsi Bebas Kegiatan */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Uraian / Deskripsi Rincian Pekerjaan</Label>
                    <textarea
                      rows={3}
                      placeholder="Ketik rincian tugas yang dikerjakan... (misal: Melakukan koordinasi, membuat laporan, memverifikasi data)"
                      value={deskripsi}
                      onChange={(e) => setDeskripsi(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Output / Hasil Kegiatan</Label>
                    <Input
                      placeholder="Misal: Dokumen Rekapitulasi / Berita Acara / Laporan"
                      value={outputKegiatan}
                      onChange={(e) => setOutputKegiatan(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Volume</Label>
                      <Input
                        type="number"
                        min={1}
                        value={volumeKegiatan}
                        onChange={(e) => setVolumeKegiatan(Number(e.target.value))}
                        className="text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Satuan Baku</Label>
                      <Input
                        value={satuanKegiatan}
                        onChange={(e) => setSatuanKegiatan(e.target.value)}
                        className="text-xs h-9 bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* Estimasi Poin Diperoleh */}
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">
                      Estimasi Poin Diperoleh:
                    </span>
                    <Badge variant="default" className="font-mono text-xs px-2 py-0.5">
                      +{volumeKegiatan * (selectedAktivitas?.nilaiPoin || 50)} Poin Kinerja
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Jam Mulai</Label>
                      <Input
                        type="time"
                        value={jamMulai}
                        onChange={(e) => setJamMulai(e.target.value)}
                        className="text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Jam Selesai</Label>
                      <Input
                        type="time"
                        value={jamSelesai}
                        onChange={(e) => setJamSelesai(e.target.value)}
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  {/* Upload Bukti Foto & Dokumen + Indikator Storage Meter */}
                  <div className="pt-2 border-t border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-slate-700">
                        Upload Bukti Tugas
                      </Label>
                      <span className="text-[10px] text-emerald-700 font-medium">
                        Alokasi: 1 GB per ASN
                      </span>
                    </div>

                    {/* Compact Storage Meter */}
                    <StorageMeter compact />

                    {quotaWarning && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800">{quotaWarning}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2 pt-1">
                      {user && (
                        <FileUploadInput
                          userId={user.id}
                          orgId={user.orgId}
                          type="foto"
                          label="+ Upload Foto Kegiatan"
                          maxSizeMB={10}
                          kegiatanDeskripsi={deskripsi || selectedAktivitas?.nama}
                          onUploaded={handleFotoUploaded}
                          onError={(msg) => setQuotaWarning(msg)}
                          onStorageCheck={(bytes) => consumeStorage(bytes)}
                        />
                      )}
                      {user && (
                        <FileUploadInput
                          userId={user.id}
                          orgId={user.orgId}
                          type="dokumen"
                          label="+ Upload PDF / Dokumen"
                          maxSizeMB={20}
                          kegiatanDeskripsi={deskripsi || selectedAktivitas?.nama}
                          onUploaded={handleDokumenUploaded}
                          onError={(msg) => setQuotaWarning(msg)}
                          onStorageCheck={(bytes) => consumeStorage(bytes)}
                        />
                      )}
                    </div>

                    {uploadedPhotos.length > 0 && (
                      <div className="flex gap-2 pt-1 overflow-x-auto">
                        {uploadedPhotos.map((url, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={i}
                            src={url}
                            alt="Thumbnail"
                            className="w-12 h-12 object-cover rounded-lg border border-emerald-300 shadow-xs"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs h-10 font-semibold"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Simpan Kegiatan ke Logbook
                  </Button>
                </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* List Kegiatan Hari Ini (7 Cols) */}
          <div className={cn("lg:col-span-7 space-y-4", activeTab === "list" ? "block" : "hidden lg:block")}>
            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <CheckCheck className="w-5 h-5 text-emerald-600" />
                    Daftar Logbook ({kegiatanList.length} Kegiatan)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Total Capaian: <strong>{totalPoinHarian} Poin</strong> • Target: {TARGET_POIN_HARIAN} Poin
                  </CardDescription>
                </div>
                <Badge variant={totalPoinHarian >= TARGET_POIN_HARIAN ? "default" : "warning"} className="text-xs">
                  {totalPoinHarian >= TARGET_POIN_HARIAN ? "Target Terpenuhi ✅" : "Belum Memenuhi Target"}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-3">
                {kegiatanList.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <FileSpreadsheet className="w-10 h-10 mx-auto opacity-40" />
                    <p className="text-xs">Belum ada kegiatan yang dicatat hari ini.</p>
                  </div>
                ) : (
                  kegiatanList.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 transition-all hover:border-slate-300"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {idx + 1}
                            </span>
                            {item.kategoriAktivitas && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold">
                                {item.kategoriAktivitas}
                              </span>
                            )}
                            {item.namaAktivitasBaku && (
                              <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                                {item.namaAktivitasBaku}
                              </span>
                            )}
                          </div>

                          <div className="font-semibold text-xs text-slate-900 leading-snug pl-6">
                            {item.deskripsi}
                          </div>

                          <div className="text-[11px] text-slate-500 pl-6 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>
                              Output: <strong className="text-slate-700">{item.outputKegiatan}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Volume: <strong className="text-slate-700">{item.volumeKegiatan} {item.satuanKegiatan}</strong>
                            </span>
                            <span>•</span>
                            <span className="text-emerald-700 font-bold">
                              Bobot: +{item.totalPoin} Poin
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-slate-600">
                            <Clock className="w-3 h-3 mr-1" />
                            {item.jamMulai} - {item.jamSelesai}
                          </Badge>
                          {canEdit && (
                            <button
                              onClick={() => handleHapusKegiatan(item.id)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Lampiran Bukti Foto / Dokumen */}
                      {((item.lampiranFotoUrls && item.lampiranFotoUrls.length > 0) ||
                        (item.lampiranDokumenUrls && item.lampiranDokumenUrls.length > 0)) && (
                        <div className="pt-2 border-t border-slate-200/60 pl-6 flex flex-wrap items-center gap-3">
                          <span className="text-[10px] text-slate-400 font-medium">
                            Bukti Terlampir:
                          </span>
                          {item.lampiranFotoUrls?.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:underline font-medium"
                            >
                              <ImageIcon className="w-3 h-3" /> Foto Bukti {i + 1}
                            </a>
                          ))}
                          {item.lampiranDokumenUrls?.map((doc, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-[11px] text-blue-700 font-medium"
                            >
                              <FileText className="w-3 h-3" /> {doc}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
