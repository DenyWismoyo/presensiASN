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
import { playSuccessChime } from "@/lib/sound";
import { MotionStaggerContainer, MotionFadeUp } from "@/components/ui/motion-wrapper";
import {
  FileText,
  Calendar,
  UploadCloud,
  CheckCircle2,
  FileCheck,
  Send,
  Loader2,
  Paperclip,
  Inbox,
  AlertCircle
} from "lucide-react";

export default function TabIzin() {
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

  const [showForm, setShowForm] = useState(false);

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

    let dokumenUrl: string | undefined = undefined;
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

      const dMulai = new Date(tanggalMulai);
      const dSelesai = new Date(tanggalSelesai);
      const diffTime = Math.abs(dSelesai.getTime() - dMulai.getTime());
      const jumlahHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      await submitIzinMutation.mutateAsync({
        userId: user.id,
        nama: user.nama,
        nip: user.nip,
        orgId: user.orgId,
        atasanId: user.atasanId || "",
        jenis,
        tanggalMulai,
        tanggalSelesai,
        jumlahHari,
        alasan,
        dokumenNama: dokumenNama || undefined,
        dokumenUrl,
      });

      setSuccessMessage(
        `Permohonan ${jenis} Anda berhasil diajukan ke atasan untuk verifikasi.`
      );
      setAlasan("");
      setFileToUpload(null);
      setShowForm(false);
      playSuccessChime();
      setTimeout(() => setSuccessMessage(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MotionStaggerContainer className="space-y-6">
      {successMessage && (
        <MotionFadeUp className="px-4 sm:px-0">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        </MotionFadeUp>
      )}

      {/* Hero Button / Card for New Request */}
      <MotionFadeUp>
        {!showForm ? (
          <div className="px-4 sm:px-0">
          <div 
            onClick={() => setShowForm(true)}
            className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-500 to-emerald-600 p-5 text-white shadow-md cursor-pointer border border-emerald-400/50 hover:scale-[1.02] transition-transform active:scale-95"
          >
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/20 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
                <FileCheck className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold tracking-wide text-lg">Ajukan Izin Baru</h3>
                <p className="text-[11px] text-teal-100 font-medium mt-0.5">Cuti, Sakit, atau Dinas Luar</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-xl leading-none mb-1">+</span>
              </div>
            </div>
          </div>
          </div>
        ) : (
          <Card className="border-teal-200/60 shadow-sm card-base relative overflow-hidden">
             <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 to-emerald-400" />
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-teal-600" />
                  Formulir Izin
                </CardTitle>
                <CardDescription className="text-[11px] mt-1">
                  Pengajuan akan diteruskan ke {user?.atasanNama || 'Atasan'}
                </CardDescription>
              </div>
              <button 
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:bg-slate-100 p-2 rounded-full -mt-2 -mr-2"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <Label htmlFor="jenis" className="text-xs font-semibold text-slate-700">Jenis Permohonan</Label>
                  <select
                    id="jenis"
                    value={jenis}
                    onChange={(e) => setJenis(e.target.value as typeof jenis)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Cuti Tahunan">Cuti Tahunan</option>
                    <option value="Izin Alasan Penting">Izin Alasan Penting</option>
                    <option value="Sakit">Sakit (Surat Dokter)</option>
                    <option value="Dinas Luar">Dinas Luar (Surat Tugas)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="tgl-mulai" className="text-xs font-semibold text-slate-700">Tgl Mulai</Label>
                    <Input
                      id="tgl-mulai"
                      type="date"
                      value={tanggalMulai}
                      onChange={(e) => setTanggalMulai(e.target.value)}
                      className="text-xs h-10 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tgl-selesai" className="text-xs font-semibold text-slate-700">Tgl Selesai</Label>
                    <Input
                      id="tgl-selesai"
                      type="date"
                      value={tanggalSelesai}
                      onChange={(e) => setTanggalSelesai(e.target.value)}
                      className="text-xs h-10 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="alasan" className="text-xs font-semibold text-slate-700">Alasan / Uraian</Label>
                  <textarea
                    id="alasan"
                    rows={3}
                    placeholder="Jelaskan rincian izin..."
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    required
                  />
                </div>

                {/* Upload Lampiran Dokumen */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Lampiran Bukti (Wajib untuk Sakit)</Label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-teal-400 bg-slate-50/50 rounded-xl p-4 text-center transition-colors">
                    <input
                      type="file"
                      id="izin-file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="izin-file"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                    >
                      <UploadCloud className="w-5 h-5 text-teal-600" />
                      <span className="text-[11px] font-bold text-slate-700">
                        {fileToUpload ? fileToUpload.name : "Pilih Dokumen"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        PDF/JPG/PNG (Maks 10MB)
                      </span>
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !alasan}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-[13px] h-12 rounded-xl shadow-sm"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Ajukan Izin</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </MotionFadeUp>

      {/* Riwayat Pengajuan */}
      <MotionFadeUp className="px-4 sm:px-0">
        <div className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              Riwayat Izin
            </h2>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{riwayat.length} Data</span>
          </div>

          <div className="space-y-3">
            {isIzinLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : riwayat.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400 space-y-2">
                <Inbox className="w-8 h-8 mx-auto opacity-40 mb-1" />
                <p className="text-xs font-medium">Belum ada riwayat izin.</p>
              </div>
            ) : (
              riwayat.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[13px] text-slate-800">{item.jenis}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize px-2 py-0.5 border ${
                        item.status === "disetujui"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : item.status === "menunggu"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {item.status === "menunggu" ? "Verifikasi" : item.status}
                    </Badge>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium line-clamp-2">{item.alasan}</p>

                  <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-bold text-slate-400 pt-2 border-t border-slate-50 mt-1">
                    <span>
                      {item.tanggalMulai} - {item.tanggalSelesai}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="text-slate-500">{item.jumlahHari} Hari</span>
                    {item.dokumenNama && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="flex items-center gap-1 text-teal-600">
                          <Paperclip className="w-3 h-3" /> Ada Lampiran
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </MotionFadeUp>
    </MotionStaggerContainer>
  );
}
