"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  useLemburHarian,
  useLemburHistory,
  usePengajuanLemburMutation,
} from "@/hooks/useLembur";
import { LemburJenis, LemburRecord } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MotionStaggerContainer, MotionFadeUp } from "@/components/ui/motion-wrapper";
import {
  Timer,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  FileText,
  User,
  Loader2,
  History,
  Info,
} from "lucide-react";

// ─── Status helpers ─────────────────────────────────────────────────────────
function getStatusBadge(status: LemburRecord["status"]) {
  switch (status) {
    case "diajukan":
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">Menunggu</Badge>;
    case "disetujui":
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">Disetujui</Badge>;
    case "ditolak":
      return <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[10px]">Ditolak</Badge>;
    case "selesai":
      return <Badge className="bg-teal-100 text-teal-700 border-teal-200 text-[10px]">Selesai</Badge>;
    default:
      return <Badge className="text-[10px]">{status}</Badge>;
  }
}

function getJenisLabel(jenis: LemburJenis) {
  switch (jenis) {
    case "hari_kerja": return "Hari Kerja";
    case "hari_libur": return "Hari Libur";
    case "hari_raya": return "Hari Raya";
  }
}

function formatDurasi(menit: number) {
  const jam = Math.floor(menit / 60);
  const sisa = menit % 60;
  if (jam === 0) return `${sisa} menit`;
  return `${jam} jam ${sisa > 0 ? sisa + " menit" : ""}`.trim();
}

export default function TabLembur() {
  const { user } = useAuth();
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const { data: lemburHariIni, isLoading: isLoadingHariIni, refetch: refetchHariIni } =
    useLemburHarian(user?.id, todayStr);
  const { data: riwayat = [], isLoading: isLoadingRiwayat } = useLemburHistory(user?.id);

  const pengajuanMutation = usePengajuanLemburMutation();

  // Form state
  const [formTanggal, setFormTanggal] = useState(todayStr);
  const [formJenis, setFormJenis] = useState<LemburJenis>("hari_kerja");
  const [formJamMulai, setFormJamMulai] = useState("16:30");
  const [formJamSelesai, setFormJamSelesai] = useState("19:00");
  const [formAlasan, setFormAlasan] = useState("");

  // Alert state
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showAlert = (type: "success" | "error", text: string) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 5000);
  };

  const handlePengajuan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!user.atasanId) {
      showAlert("error", "Atasan langsung belum ditetapkan. Hubungi Admin BKPSDM.");
      return;
    }

    if (!formAlasan.trim() || formAlasan.trim().length < 10) {
      showAlert("error", "Alasan lembur wajib diisi minimal 10 karakter.");
      return;
    }

    try {
      const res = await pengajuanMutation.mutateAsync({
        userId: user.id,
        nip: user.nip,
        nama: user.nama,
        orgId: user.orgId,
        tanggal: formTanggal,
        jenis: formJenis,
        alasanLembur: formAlasan.trim(),
        jamMulaiRencana: formJamMulai,
        jamSelesaiRencana: formJamSelesai,
        atasanId: user.atasanId || "",
        atasanNama: user.atasanNama || "",
      });

      if (res.success) {
        showAlert("success", res.message || "Pengajuan lembur berhasil dikirim.");
        setFormAlasan("");
        refetchHariIni();
      } else {
        showAlert("error", res.message || "Gagal mengajukan lembur.");
      }
    } catch (err) {
      showAlert("error", (err as Error).message || "Terjadi kesalahan.");
    }
  };

  const hasAtasan = !!user?.atasanId;
  const sudahAda = !!lemburHariIni && !["ditolak"].includes(lemburHariIni.status);

  return (
    <MotionStaggerContainer className="space-y-6">
      {/* ── Alert ───────────────────────────────────────────────────────────── */}
      {alert && (
        <MotionFadeUp className="px-4 sm:px-0">
          <div
            className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
              alert.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {alert.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{alert.text}</span>
          </div>
        </MotionFadeUp>
      )}

      {/* ── Status Lembur Hari Ini ──────────────────────────────────────────── */}
      {isLoadingHariIni ? (
        <Card>
          <CardContent className="p-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat status lembur...
          </CardContent>
        </Card>
      ) : lemburHariIni && !["ditolak"].includes(lemburHariIni.status) ? (
        <MotionFadeUp>
          <Card className="border-violet-200 card-base overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Timer className="w-4 h-4 text-violet-600" />
                  Status Lembur
                </CardTitle>
                {getStatusBadge(lemburHariIni.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="text-slate-400 mb-0.5 font-medium">Jenis</div>
                  <div className="font-semibold text-slate-800">{getJenisLabel(lemburHariIni.jenis)}</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="text-slate-400 mb-0.5 font-medium">Rencana Waktu</div>
                  <div className="font-semibold text-slate-800">
                    {lemburHariIni.jamMulaiRencana} — {lemburHariIni.jamSelesaiRencana}
                  </div>
                </div>
              </div>

              <div className="bg-violet-50 p-3 rounded-xl border border-violet-100 text-xs">
                <div className="text-violet-700 font-bold mb-1">Alasan Lembur:</div>
                <div className="text-slate-700">{lemburHariIni.alasanLembur}</div>
              </div>

              {lemburHariIni.catatanAtasan && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-xs">
                  <div className="text-amber-700 font-bold mb-1">Catatan {lemburHariIni.atasanNama}:</div>
                  <div className="text-amber-900">{lemburHariIni.catatanAtasan}</div>
                </div>
              )}

              {lemburHariIni.status === "disetujui" && (
                <div className="pt-3 border-t border-slate-100 text-center">
                  <p className="text-[11px] text-slate-500 font-medium bg-slate-50 inline-block px-3 py-1.5 rounded-full border border-slate-200">
                    Gunakan Tab <strong className="text-slate-700">Absensi</strong> untuk Check-in / Check-out lembur.
                  </p>
                </div>
              )}

            </CardContent>
          </Card>
        </MotionFadeUp>
      ) : null}

      {/* ── Form Pengajuan Lembur ──────────────────────────────────────────── */}
      {!sudahAda && (
        <MotionFadeUp>
          <Card className="border-slate-200/60 card-base shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Send className="w-4 h-4 text-violet-600" />
                Ajukan Lembur
              </CardTitle>
              <CardDescription className="text-[11px]">
                Pengajuan akan dikirim ke atasan langsung Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!hasAtasan ? (
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-medium">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    Atasan langsung Anda belum ditetapkan. Hubungi Admin BKPSDM.
                  </span>
                </div>
              ) : (
                <form onSubmit={handlePengajuan} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Tanggal */}
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Tanggal <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        required
                        value={formTanggal}
                        onChange={(e) => setFormTanggal(e.target.value)}
                        className="text-xs h-10 rounded-xl"
                      />
                    </div>

                    {/* Jenis */}
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">
                        Jenis <span className="text-rose-500">*</span>
                      </Label>
                      <select
                        value={formJenis}
                        onChange={(e) => setFormJenis(e.target.value as LemburJenis)}
                        className="w-full text-xs h-10 rounded-xl border border-slate-200 bg-white px-3 text-slate-800 focus:ring-2 focus:ring-violet-500 outline-none"
                      >
                        <option value="hari_kerja">Hari Kerja (setelah jam kantor)</option>
                        <option value="hari_libur">Hari Libur / Weekend</option>
                        <option value="hari_raya">Hari Raya</option>
                      </select>
                    </div>
                  </div>

                  {/* Jam Rencana */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Mulai <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        type="time"
                        required
                        value={formJamMulai}
                        onChange={(e) => setFormJamMulai(e.target.value)}
                        className="text-xs h-10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Selesai <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        type="time"
                        required
                        value={formJamSelesai}
                        onChange={(e) => setFormJamSelesai(e.target.value)}
                        className="text-xs h-10 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Alasan */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      Uraian Kegiatan Lembur <span className="text-rose-500">*</span>
                    </Label>
                    <textarea
                      required
                      minLength={10}
                      rows={3}
                      placeholder="Contoh: Penyelesaian laporan akhir tahun..."
                      value={formAlasan}
                      onChange={(e) => setFormAlasan(e.target.value)}
                      className="w-full text-[13px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                    />
                    <p className="text-[10px] text-slate-400 font-medium text-right">{formAlasan.length}/300 karakter</p>
                  </div>

                  <Button
                    type="submit"
                    disabled={pengajuanMutation.isPending}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-[13px] h-12 shadow-sm rounded-xl"
                  >
                    {pengajuanMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim...</>
                    ) : (
                      <><Send className="w-4 h-4 mr-2" /> Ajukan Lembur</>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </MotionFadeUp>
      )}

      {/* ── Riwayat Lembur ──────────────────────────────────────────────────── */}
      <MotionFadeUp className="px-4 sm:px-0">
        <div className="pt-4">
          <h3 className="font-extrabold text-slate-800 text-sm mb-4 tracking-tight flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            Riwayat Lembur (30 Hari)
          </h3>
          {isLoadingRiwayat ? (
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-8">
              <Loader2 className="w-4 h-4 animate-spin" /> Memuat...
            </div>
          ) : riwayat.length === 0 ? (
            <div className="text-center py-8 text-slate-400 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <Timer className="w-8 h-8 mx-auto text-slate-200 mb-2" />
              <p className="text-xs font-medium">Belum ada riwayat lembur.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {riwayat.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 p-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{item.tanggal}</span>
                      <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">{getJenisLabel(item.jenis)}</span>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{item.alasanLembur}</p>
                  <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {item.jamMulaiRencana} — {item.jamSelesaiRencana}
                    </span>
                    {item.durasiLemburMenit && item.durasiLemburMenit > 0 && (
                      <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                        Aktual: {formatDurasi(item.durasiLemburMenit)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </MotionFadeUp>
    </MotionStaggerContainer>
  );
}
