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
  Timer,
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
      name: "Kehadiran (Hub)",
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
      name: "Data Pegawai",
      href: "/pegawai",
      icon: Users,
      roles: ["admin"],
    },
    {
      name: "Pengaturan Kantor",
      href: "/pengaturan",
      icon: Settings,
      roles: ["admin", "atasan"],
    },
  ];

  const filteredNav = navigation.filter((item) =>
    user ? item.roles.includes(user.role) : true
  );

  return (
    <aside className="sidebar-base">
      {/* Branding */}
      <div className="sidebar-brand-box">
        <div className="sidebar-logo-icon">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
            TECHNO SIGN
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/20 text-primary border border-primary/30 font-semibold">
              SMART
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">UPTD KST Solo Technopark</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="sidebar-nav-container">
        <div className="sidebar-nav-heading">
          Menu Navigasi
        </div>
        {filteredNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={isActive ? "sidebar-nav-item-active group" : "sidebar-nav-item group"}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={isActive ? "sidebar-nav-icon-active" : "sidebar-nav-icon"}
                />
                <span>{item.name}</span>
              </div>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-primary" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Kantor & Geofence Status Widget */}
      <div className="sidebar-widget">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-foreground/80">
            Radius Geofence
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold">
            Aktif 150m
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-tight">
          Balaikota / Gedung BKPSDM Pusat (Pukul 07:30 - 16:00 WIB)
        </p>
      </div>
    </aside>
  );
}
