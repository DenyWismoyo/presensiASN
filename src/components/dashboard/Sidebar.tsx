"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClockCheck,
  FileSpreadsheet,
  Users,
  Building2,
  BarChart3,
  Settings,
  ShieldAlert,
  ChevronRight,
  FileText,
  Calendar,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navigation = [
    {
      name: "Dashboard Utama",
      href: "/",
      icon: LayoutDashboard,
      roles: ["admin", "atasan", "pegawai"],
    },
    {
      name: "Presensi Harian",
      href: "/presensi",
      icon: ClockCheck,
      roles: ["admin", "atasan", "pegawai"],
    },
    {
      name: "Laporan Kegiatan (LKH)",
      href: "/laporan",
      icon: FileSpreadsheet,
      roles: ["admin", "atasan", "pegawai"],
    },
    {
      name: "Pengajuan Izin & Cuti",
      href: "/izin",
      icon: FileText,
      roles: ["admin", "atasan", "pegawai"],
    },
    {
      name: "Kalender Kerja",
      href: "/kalender",
      icon: Calendar,
      roles: ["admin", "atasan", "pegawai"],
    },
    {
      name: "Approval Tim",
      href: "/approval",
      icon: ShieldAlert,
      roles: ["admin", "atasan"],
    },
    {
      name: "Rekap & Statistik",
      href: "/statistik",
      icon: BarChart3,
      roles: ["admin", "atasan"],
    },
    {
      name: "Data Pegawai ASN",
      href: "/pegawai",
      icon: Users,
      roles: ["admin"],
    },
    {
      name: "Pengaturan Kantor",
      href: "/pengaturan",
      icon: Settings,
      roles: ["admin"],
    },
  ];

  const filteredNav = navigation.filter((item) =>
    user ? item.roles.includes(user.role) : true
  );

  return (
    <aside className="hidden md:flex w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex-col shrink-0 min-h-screen">
      {/* Branding */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white font-bold text-sm border border-emerald-400/30">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
            SI-PRESENSI
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
              ASN
            </span>
          </div>
          <p className="text-[11px] text-slate-400">BKPSDM Terpadu</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Menu Navigasi
        </div>
        {filteredNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group",
                isActive
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-emerald-400"
                      : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                <span>{item.name}</span>
              </div>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Kantor & Geofence Status Widget */}
      <div className="p-3 m-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-300">
            Radius Geofence
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
            Aktif 150m
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          Balaikota / Gedung BKPSDM Pusat (Pukul 07:30 - 16:00 WIB)
        </p>
      </div>
    </aside>
  );
}
