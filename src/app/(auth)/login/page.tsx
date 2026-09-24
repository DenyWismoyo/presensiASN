"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const IS_DEV = process.env.NODE_ENV === "development";

import {
  ShieldCheck,
  UserCheck,
  Building2,
  Lock,
  ArrowRight,
  Sparkles,
  MapPin,
  FileCheck2,
  Clock
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithCredentials, isLoading } = useAuth();
  const [nipOrEmail, setNipOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!nipOrEmail) {
      setErrorMsg("NIP atau Email kedinasan wajib diisi.");
      return;
    }
    if (!password) {
      setErrorMsg("Kata sandi wajib diisi.");
      return;
    }

    try {
      await loginWithCredentials(nipOrEmail, password);
      router.push("/");
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "";
      if (msg.includes("UNAUTHORIZED") || msg.includes("belum terdaftar")) {
        setErrorMsg(msg);
      } else if (msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setErrorMsg("Kata sandi salah. Silakan coba lagi.");
      } else if (msg.includes("user-not-found") || msg.includes("invalid-email")) {
        setErrorMsg("NIP atau Email tidak ditemukan dalam sistem.");
      } else if (msg.includes("too-many-requests")) {
        setErrorMsg("Terlalu banyak percobaan login. Coba lagi dalam beberapa menit.");
      } else {
        setErrorMsg("Gagal melakukan autentikasi. Periksa NIP/email dan kata sandi Anda.");
      }
    }
  };

  // DEV-ONLY: Login cepat untuk pengujian (tidak tersedia di production)
  const handleDevQuickLogin = async (email: string, password: string) => {
    if (!IS_DEV) return;
    setNipOrEmail(email);
    setPassword(password);
    try {
      await loginWithCredentials(email, password);
      router.push("/");
    } catch (err) {
      setErrorMsg(`[DEV] Login gagal: ${(err as Error).message}`);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-slate-100 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header / Branding */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/25 border border-emerald-400/30 shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-white">
                TECHNO SIGN
              </span>
              <Badge variant="default" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px] sm:text-[10px] px-1.5 py-0.2">
                PRO
              </Badge>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400">
              UPTD KST Solo Technopark
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700/50">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Geofencing Presisi</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700/50">
            <FileCheck2 className="w-3.5 h-3.5 text-teal-400" />
            <span>LKH Terintegrasi</span>
          </div>
        </div>
      </header>

      {/* Main Login Grid */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-2 sm:px-6 sm:py-8 flex-1 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12">
        {/* Left Hero Text (Desktop Only) */}
        <div className="hidden lg:block flex-1 max-w-xl text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Platform Terpadu Akuntabilitas Kinerja
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Presensi Digital & Laporan Kegiatan{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Harian Pegawai
            </span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Sistem absensi berbasis verifikasi geolokasi GPS dan swafoto selfie, terhubung langsung dengan pelaporan kegiatan harian untuk transparansi kinerja dan pengajuan Sasaran Kinerja Pegawai (SKP).
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
              <Clock className="w-5 h-5 text-emerald-400 mb-1.5" />
              <div className="font-semibold text-xs text-white">Jam Kerja Otomatis</div>
              <div className="text-[11px] text-slate-400">Deteksi hadir / terlambat</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
              <MapPin className="w-5 h-5 text-teal-400 mb-1.5" />
              <div className="font-semibold text-xs text-white">Radius Kantor</div>
              <div className="text-[11px] text-slate-400">Validasi koordinat 150m</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
              <FileCheck2 className="w-5 h-5 text-cyan-400 mb-1.5" />
              <div className="font-semibold text-xs text-white">Upload Bukti LKH</div>
              <div className="text-[11px] text-slate-400">Foto kegiatan & berkas PDF</div>
            </div>
          </div>
        </div>

        {/* Mobile Header Banner (Mobile Only) */}
        <div className="lg:hidden text-center space-y-1 mb-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium">
            <Sparkles className="w-3 h-3" />
            Portal Absensi & Kinerja
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Presensi GPS & LKH Harian
          </h2>
        </div>

        {/* Right Login Card */}
        <div className="w-full max-w-md">
          <Card className="border-slate-700/60 bg-slate-900/80 backdrop-blur-xl shadow-2xl text-slate-100">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-white">
                  Masuk Portal Techno Sign
                </CardTitle>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <CardDescription className="text-slate-400 text-xs">
                Gunakan NIP resmi atau Email kedinasan Anda
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleManualLogin} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">NIP / Email / Access Code</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Contoh: STP-001 atau Email"
                      value={nipOrEmail}
                      onChange={(e) => setNipOrEmail(e.target.value)}
                      className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500 text-xs h-10"
                    />
                    <UserCheck className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-300">Kata Sandi</Label>
                    <a href="#" className="text-[11px] text-emerald-400 hover:underline">
                      Lupa sandi?
                    </a>
                  </div>
                  <div className="relative">
                    <Input
                      type="password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500 text-xs h-10"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/30 text-xs h-10 font-semibold mt-2"
                >
                  {isLoading ? "Memverifikasi Kredensial..." : "Masuk ke Sistem"}
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </form>

              {/* Quick Login — Hanya tampil di mode development */}
              {IS_DEV && (
                <div className="pt-3 border-t border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-amber-400">
                      ⚠️ Mode Development — Akun Test:
                    </span>
                    <Badge variant="outline" className="text-[10px] border-amber-700 text-amber-400 py-0">
                      Dev Only
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleDevQuickLogin("budi.santoso@surakarta.go.id", "asn123456")}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-emerald-950/60 border border-amber-700/40 hover:border-emerald-500/60 text-left transition-all group"
                    >
                      <div className="text-[11px] font-semibold text-slate-200 group-hover:text-emerald-300">
                        Pegawai
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">
                        Budi Santoso
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDevQuickLogin("siti.rahmawati@surakarta.go.id", "asn123456")}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-teal-950/60 border border-amber-700/40 hover:border-teal-500/60 text-left transition-all group"
                    >
                      <div className="text-[11px] font-semibold text-slate-200 group-hover:text-teal-300">
                        Atasan
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">
                        Siti Rahmawati
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDevQuickLogin("admin.stp@surakarta.go.id", "asn123456")}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-blue-950/60 border border-amber-700/40 hover:border-blue-500/60 text-left transition-all group"
                    >
                      <div className="text-[11px] font-semibold text-slate-200 group-hover:text-blue-300">
                        Admin
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">
                        BKPSDM
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="pt-0 text-center justify-center">
              <p className="text-[10px] text-slate-500">
                Terproteksi Firebase Auth & Standar Keamanan Data • Versi 1.0.0
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-4 border-t border-slate-800/80 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} UPTD KST Solo Technopark. Hak Cipta Dilindungi Undang-Undang.
      </footer>
    </main>
  );
}
