"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { uploadAsnFile } from "@/lib/firebase/storage-helpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Calendar,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Send,
  Loader2,
  Plus,
  Paperclip,
  Building,
} from "lucide-react";

interface PengajuanIzinItem {
  id: string;
  jenis: "Cuti Tahunan" | "Izin Alasan Penting" | "Sakit" | "Dinas Luar";
  tanggalMulai: string;
  tanggalSelesai: string;
  jumlahHari: number;
  alasan: string;
  dokumenUrl?: string;
  dokumenNama?: string;
  status: "menunggu" | "disetujui" | "ditolak";
  createdAt: string;
}

export default function IzinPage() {
  const { user, consumeStorage } = useAuth();

  const [jenis, setJenis] = useState<PengajuanIzinItem["jenis"]>("Cuti Tahunan");
  const [tanggalMulai, setTanggalMulai] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [tanggalSelesai, setTanggalSelesai] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [alasan, setAlasan] = useState("");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Riwayat Pengajuan Demo
  const [riwayat, setRiwayat] = useState<PengajuanIzinItem[]>([
    {
      id: "izin-001",
      jenis: "Dinas Luar",
      tanggalMulai: "2026-09-10",
      tanggalSelesai: "2026-09-11",
      jumlahHari: 2,
      alasan: "Menghadiri Rapat Koordinasi Nasional BKN SIASN di Jakarta Pusat",
      dokumenNama: "Surat_Tugas_KemenPANRB.pdf",
      dokumenUrl: "#",
      status: "disetujui",
      createdAt: "2026-09-08T09:00:00Z",
    },
    {
      id: "izin-002",
      jenis: "Cuti Tahunan",
      tanggalMulai: "2026-10-01",
      tanggalSelesai: "2026-10-03",
      jumlahHari: 3,
      alasan: "Keperluan keluarga di luar kota",
      dokumenNama: "Formulir_Cuti_ASN.pdf",
      dokumenUrl: "#",
      status: "menunggu",
      createdAt: "2026-09-14T14:30:00Z",
    },
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !alasan) return;

    setIsSubmitting(true);
    setSuccessMessage(null);

    let dokumenUrl = "#";
    let dokumenNama = "";

    try {
      if (fileToUpload) {
        dokumenNama = fileToUpload.name;
        // Kurangi kuota storage 1 GB ASN
        consumeStorage(fileToUpload.size);

        // Upload ke Firebase Storage
        const uploadResult = await uploadAsnFile({
          file: fileToUpload,
          fileName: fileToUpload.name,
          userId: user.id,
          orgId: user.orgId,
          type: "dokumen",
          kegiatanDeskripsi: `Pengajuan ${jenis}: ${alasan}`,
        });
        dokumenUrl = uploadResult.url;
      }

      const tgl1 = new Date(tanggalMulai);
      const tgl2 = new Date(tanggalSelesai);
      const diffTime = Math.abs(tgl2.getTime() - tgl1.getTime());
      const jumlahHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const newItem: PengajuanIzinItem = {
        id: `izin-${Date.now()}`,
        jenis,
        tanggalMulai,
        tanggalSelesai,
        jumlahHari,
        alasan,
        dokumenUrl,
        dokumenNama: dokumenNama || undefined,
        status: "menunggu",
        createdAt: new Date().toISOString(),
      };

      setRiwayat([newItem, ...riwayat]);
      setAlasan("");
      setFileToUpload(null);
      setSuccessMessage(
        `Permohonan ${jenis} Anda berhasil diajukan dan diteruskan ke Atasan Langsung untuk diverifikasi.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-600" />
            Pengajuan Izin, Cuti & Dinas Luar ASN
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Layanan terpadu dispensasi kehadiran kerja resmi berbasis peraturan kepegawaian
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-teal-500/40 text-teal-700 bg-teal-50 px-3 py-1">
            Sisa Cuti Tahunan: <strong>9 Hari</strong>
          </Badge>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid Utama: Form Input & Riwayat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Form Pengajuan */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-600" />
                Formulir Pengajuan Baru
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Isi rincian permohonan dan lampirkan surat pendukung
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Jenis Permohonan */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-700">Kategori Permohonan</Label>
                  <select
                    value={jenis}
                    onChange={(e) => setJenis(e.target.value as PengajuanIzinItem["jenis"])}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Cuti Tahunan">Cuti Tahunan</option>
                    <option value="Izin Alasan Penting">Izin Alasan Penting</option>
                    <option value="Sakit">Sakit (Surat Dokter)</option>
                    <option value="Dinas Luar">Tugas Dinas Luar Kantor</option>
                  </select>
                </div>

                {/* Periode Tanggal */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-600">Tanggal Mulai</Label>
                    <Input
                      type="date"
                      value={tanggalMulai}
                      onChange={(e) => setTanggalMulai(e.target.value)}
                      className="text-xs h-9 bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-600">Tanggal Selesai</Label>
                    <Input
                      type="date"
                      value={tanggalSelesai}
                      onChange={(e) => setTanggalSelesai(e.target.value)}
                      className="text-xs h-9 bg-white"
                      required
                    />
                  </div>
                </div>

                {/* Alasan / Keperluan */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-700">Alasan & Uraian Kebutuhan</Label>
                  <textarea
                    rows={3}
                    placeholder="Jelaskan keperluan izin atau rincian penugasan dinas..."
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                {/* Unggah Berkas Bukti (PDF / Foto) */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-700">Lampiran Berkas / Surat Tugas (PDF/Foto)</Label>
                  <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center space-y-2 hover:bg-slate-50 transition-colors">
                    <input
                      type="file"
                      id="izin-file"
                      accept=".pdf,image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="izin-file"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-1"
                    >
                      <UploadCloud className="w-6 h-6 text-teal-600" />
                      <span className="text-[11px] font-semibold text-slate-700">
                        {fileToUpload ? fileToUpload.name : "Pilih Berkas Lampiran"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Format PDF, JPG, atau PNG (Maks 10 MB)
                      </span>
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !alasan}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs h-10 shadow-xs"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-1.5" />
                  )}
                  Ajukan Permohonan Izin
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Riwayat Pengajuan */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-600" />
              Riwayat Permohonan Izin Anda
            </h2>
            <span className="text-xs text-slate-500">{riwayat.length} Rekaman</span>
          </div>

          <div className="space-y-3">
            {riwayat.map((item) => (
              <Card key={item.id} className="border-slate-200/80 shadow-xs">
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{item.jenis}</span>
                      <Badge
                        variant={
                          item.status === "disetujui"
                            ? "default"
                            : item.status === "menunggu"
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-[10px] capitalize"
                      >
                        {item.status === "menunggu" ? "Menunggu Verifikasi" : item.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{item.alasan}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <span>
                        Periode: <strong>{item.tanggalMulai}</strong> s/d <strong>{item.tanggalSelesai}</strong>
                      </span>
                      <span>•</span>
                      <span>Durasi: <strong>{item.jumlahHari} Hari</strong></span>
                      {item.dokumenNama && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-teal-700 font-medium">
                            <Paperclip className="w-3 h-3" />
                            {item.dokumenNama}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right sm:self-center shrink-0">
                    <span className="text-[10px] text-slate-400">
                      Diajukan: {new Date(item.createdAt).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
