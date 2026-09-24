"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import StorageMeter from "@/components/dashboard/StorageMeter";
import {
  User,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  LogOut,
  Award,
  IdCard,
  Building2,
  Calendar,
  CheckCircle2,
} from "lucide-react";

export default function ProfilPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <IdCard className="w-6 h-6 text-emerald-600" />
          Kartu Identitas Digital ASN
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Data profil dan informasi kepegawaian resmi yang terdaftar di sistem
        </p>
      </div>

      {/* ASN Digital ID Card */}
      <Card className="overflow-hidden bg-gradient-to-b from-white to-slate-50">
        {/* Card Header Pattern */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold tracking-wider uppercase">
                Pemerintah Republik Indonesia
              </span>
            </div>
            <Badge variant="default" className="bg-emerald-500/30 text-emerald-300 border-emerald-400/40 text-[10px]">
              PNS AKTIF
            </Badge>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <Avatar
              fallback={user?.nama ? user.nama.substring(0, 2).toUpperCase() : "AS"}
              size="lg"
              className="ring-4 ring-white/20 shadow-lg text-lg"
            />
            <div>
              <h2 className="text-lg sm:text-xl font-bold leading-tight">
                {user?.nama || "Pegawai ASN"}
              </h2>
              <p className="text-xs text-emerald-200/90 mt-0.5 font-mono">
                NIP: {user?.nip || "-"}
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {user?.jabatan}
              </p>
            </div>
          </div>
        </div>

        {/* Card Body Data */}
        <CardContent className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200/70 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                Pangkat & Golongan
              </span>
              <div className="font-semibold text-slate-800">
                {user?.golongan || "III/a - Penata Muda"}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200/70 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                Peran Sistem
              </span>
              <div className="font-semibold text-slate-800 capitalize">
                {user?.role === "pegawai"
                  ? "Pegawai Pelaksana"
                  : user?.role === "atasan"
                  ? "Pejabat Penilai / Atasan"
                  : "Administrator BKPSDM"}
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/80">
              <span className="text-slate-500 flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                Instansi / SKPD
              </span>
              <span className="font-semibold text-slate-800 text-right">
                {user?.instansi || "Badan Kepegawaian dan Pengembangan SDM"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/80">
              <span className="text-slate-500 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                Email Kedinasan
              </span>
              <span className="font-semibold text-slate-800">
                {user?.email || "-"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/80">
              <span className="text-slate-500 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                Nomor Kontak WhatsApp
              </span>
              <span className="font-semibold text-slate-800 font-mono">
                {user?.nomorHp || "081234567890"}
              </span>
            </div>
          </div>

          {/* Logout Action */}
          <div className="pt-3">
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full h-11 text-xs font-semibold shadow-xs"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Keluar dari Akun ASN
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alokasi Kuota Penyimpanan 1 GB per ASN */}
      <StorageMeter />
    </div>
  );
}
