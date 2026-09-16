"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { uploadAsnFile } from "@/lib/firebase/storage-helpers";
import { useIzinList, useSubmitIzinMutation } from "@/hooks/useIzin";
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
  Paperclip,
  Building,
  Inbox,
} from "lucide-react";

export default function IzinPage() {
  const { user, consumeStorage } = useAuth();
  const { data: riwayat = [], isLoading: isIzinLoading } = useIzinList(user?.id);
  const submitIzinMutation = useSubmitIzinMutation();

  const [jenis, setJenis] = useState<"Cuti Tahunan" | "Izin Alasan Penting" | "Sakit" | "Dinas Luar">("Cuti Tahunan");
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
        consumeStorage(fileToUpload.size);

        const uploadResult = await uploadAsnFile({
          file: fileToUpload,
          fileName: fileToUpload.name,
          userId: user.id,
          orgId: user.orgId,
          type: "dokumen",
        });

        if (uploadResult && uploadResult.url) {
          dokumenUrl = uploadResult.url;
        }
      }

      // Hitung selisih hari
      const dMulai = new Date(tanggalMulai);
      const dSelesai = new Date(tanggalSelesai);
      const diffTime = Math.abs(dSelesai.getTime() - dMulai.getTime());
      const jumlahHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      await submitIzinMutation.mutateAsync({
        userId: user.id,
        nama: user.nama,
        nip: user.nip,
        jenis,
        tanggalMulai,
        tanggalSelesai,
        jumlahHari,
        alasan,
        dokumenNama: dokumenNama || undefined,
        dokumenUrl: dokumenUrl !== "#" ? dokumenUrl : undefined,
      });

      setSuccessMessage(
        `Permohonan ${jenis} Anda berhasil diajukan ke atasan untuk verifikasi.`
      );
      setAlasan("");
      setFileToUpload(null);
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
            Pengajuan Izin, Cuti & Surat Tugas Dinas Luar
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Layanan terintegrasi permohonan ketidakhadiran kerja ASN dengan lampiran surat resmi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs py-1 px-3 border-teal-500/30 text-teal-700 bg-teal-50/50">
            Hak Cuti Tahunan: 12 Hari
          </Badge>
        </div>
      </div>

      {/* Grid: Form Pengajuan (Kiri) + Riwayat (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Form Input */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-600" />
                Formulir Pengajuan
              </CardTitle>
              <CardDescription className="text-xs">
                Lengkapi rincian tanggal dan dokumen pendukung kedinasan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {successMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <Label htmlFor="jenis" className="text-xs text-slate-700">Jenis Permohonan</Label>
                  <select
                    id="jenis"
                    value={jenis}
                    onChange={(e) => setJenis(e.target.value as typeof jenis)}
                    className="w-full h-10 px-3 py-2 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Cuti Tahunan">Cuti Tahunan</option>
                    <option value="Izin Alasan Penting">Izin Alasan Penting</option>
                    <option value="Sakit">Sakit (Surat Dokter)</option>
                    <option value="Dinas Luar">Dinas Luar (Surat Tugas)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="tgl-mulai" className="text-xs text-slate-700">Tanggal Mulai</Label>
                    <Input
                      id="tgl-mulai"
                      type="date"
                      value={tanggalMulai}
                      onChange={(e) => setTanggalMulai(e.target.value)}
                      className="text-xs h-9"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tgl-selesai" className="text-xs text-slate-700">Tanggal Selesai</Label>
                    <Input
                      id="tgl-selesai"
                      type="date"
                      value={tanggalSelesai}
                      onChange={(e) => setTanggalSelesai(e.target.value)}
                      className="text-xs h-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="alasan" className="text-xs text-slate-700">Alasan / Uraian Keperluan</Label>
                  <textarea
                    id="alasan"
                    rows={3}
                    placeholder="Jelaskan alasan atau agenda kedinasan secara rinci..."
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                {/* Upload Lampiran Dokumen */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-700">Lampiran Dokumen Bukti (Opsional)</Label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-xl p-4 text-center transition-colors">
                    <input
                      type="file"
                      id="izin-file"
                      accept=".pdf,.jpg,.jpeg,.png"
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
            {riwayat.length === 0 ? (
              <Card className="border-slate-200/80 shadow-xs">
                <CardContent className="py-12 text-center text-slate-400 space-y-2">
                  <Inbox className="w-10 h-10 mx-auto opacity-40" />
                  <p className="text-xs">Belum ada permohonan izin atau cuti yang diajukan.</p>
                </CardContent>
              </Card>
            ) : (
              riwayat.map((item) => (
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
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(item.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
