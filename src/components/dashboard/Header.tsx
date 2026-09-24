"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LogOut,
  Calendar,
  Clock,
  ShieldAlert,
  Building2,
  Menu,
  X,
  LayoutDashboard,
  ClockCheck,
  FileSpreadsheet,
  FileText,
  Settings,
  User,
  Users,
  BarChart3,
  ChevronRight,
} from "lucide-react";

function getRoleBadgeVariant(role?: UserRole) {
  switch (role) {
    case "admin":
      return "destructive" as const;
    case "atasan":
      return "secondary" as const;
    default:
      return "default" as const;
  }
}

function getRoleLabel(role?: UserRole): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "atasan":
      return "Atasan";
    case "pegawai":
    default:
      return "Pegawai";
  }
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [currentDateTime, setCurrentDateTime] = useState<string>("");
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(now);
      setCurrentDateTime(formatted + " WIB");
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    setIsDrawerOpen(false);
    await logout();
    router.push("/login");
  };

  // Navigasi lengkap untuk Mobile Drawer (Zero Hidden Routes)
  const fullNavigation = [
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
    {
      name: "Profil Pegawai",
      href: "/profil",
      icon: User,
      roles: ["admin", "atasan", "pegawai"],
    },
  ];

  const filteredNav = fullNavigation.filter((item) =>
    user ? item.roles.includes(user.role) : true
  );

  return (
    <>
      <header className="header-glass">
        {/* Left: Hamburger (Mobile) + Brand Logo + Desktop Clock */}
        <div className="flex items-center gap-2.5 text-xs">
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="md:hidden p-1.5 -ml-1.5 rounded-lg text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Buka Semua Menu"
            title="Buka Menu Lengkap"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile Brand Logo */}
          <div className="flex md:hidden items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-sm">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-foreground leading-none">
                TECHNO SIGN
              </span>
              <span className="block text-[9px] text-primary font-semibold leading-none mt-0.5">
                SMART
              </span>
            </div>
          </div>

          {/* Desktop Clock */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-800 tracking-tight">
              {currentDateTime || "Memuat Waktu..."}
            </span>
          </div>
        </div>

        {/* Right: User Profile + Role Badge */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Role Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
            {user?.role === "admin" ? (
              <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            ) : null}
            <span className="text-[11px] text-slate-500 hidden sm:inline">Peran:</span>
            <Badge
              variant={getRoleBadgeVariant(user?.role)}
              className="capitalize text-[10px] px-2 py-0"
            >
              {getRoleLabel(user?.role)}
            </Badge>
          </div>

          {/* User Profile Card in Header */}
          <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
            <Avatar
              fallback={user?.nama ? user.nama.substring(0, 2).toUpperCase() : "AS"}
              size="md"
            />
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {user?.nama || "Pegawai"}
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">
                NIP / ID: {user?.nip || "-"} • {user?.golongan?.split(" - ")[0]}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-500 hover:text-red-600 hover:bg-red-50 h-9 px-2"
            title="Keluar Akun"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer (Zero Hidden Routes) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[80vw] bg-card text-card-foreground h-full flex flex-col z-10 shadow-2xl border-r border-border animate-in slide-in-from-left duration-200">
            {/* Header Drawer */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-sm">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-foreground block">TECHNO SIGN</span>
                  <span className="text-[10px] text-primary font-semibold block">SMART</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Card in Drawer */}
            <div className="p-3.5 m-3 rounded-xl bg-secondary/50 border border-border/50 space-y-1">
              <div className="text-xs font-bold text-foreground truncate">{user?.nama || "Pegawai"}</div>
              <div className="text-[10px] text-muted-foreground">NIP/ID: {user?.nip || "-"}</div>
              <div className="text-[10px] text-primary font-medium truncate">{user?.instansi}</div>
              <div className="pt-1 flex items-center gap-1.5">
                <Badge variant={getRoleBadgeVariant(user?.role)} className="text-[9px] px-2 py-0">
                  {getRoleLabel(user?.role)}
                </Badge>
              </div>
            </div>

            {/* Full Menu Links */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
              <div className="px-2 pb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Daftar Lengkap Menu
              </div>

              {filteredNav.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsDrawerOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-98",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20 font-semibold shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary" />}
                  </Link>
                );
              })}
            </div>

            {/* Bottom Action */}
            <div className="p-3 border-t border-border/50">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-10 px-3"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Keluar Sesi
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
