"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, DEMO_USERS } from "@/lib/auth-context";
import { UserRole } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Calendar,
  Clock,
  ChevronDown,
  UserCheck,
  ShieldAlert,
  Building2,
} from "lucide-react";

export default function Header() {
  const router = useRouter();
  const { user, logout, switchRole } = useAuth();
  const [currentDateTime, setCurrentDateTime] = useState<string>("");
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

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

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleSelectRole = (role: UserRole) => {
    switchRole(role);
    setIsRoleDropdownOpen(false);
  };

  const getRoleBadgeVariant = (role?: UserRole) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "atasan":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-xs sticky top-0 z-30">
      {/* Left: Mobile Brand & Desktop Real-time Clock */}
      <div className="flex items-center gap-3 text-xs">
        {/* Mobile Brand Logo */}
        <div className="flex md:hidden items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-xs text-slate-900 leading-none">
              SI-PRESENSI
            </span>
            <span className="block text-[9px] text-emerald-700 font-semibold leading-none mt-0.5">
              ASN KINERJA
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

      {/* Right: Quick Role Switcher + User Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs text-slate-800 transition-all font-medium"
          >
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Mode Peran:
            </span>
            <Badge
              variant={getRoleBadgeVariant(user?.role)}
              className="capitalize text-[10px] px-2 py-0"
            >
              {user?.role || "pegawai"}
            </Badge>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Ganti Peran ASN
              </div>
              <button
                onClick={() => handleSelectRole("pegawai")}
                className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center justify-between text-slate-700 hover:text-emerald-800"
              >
                <div>
                  <div className="font-semibold">Pegawai ASN</div>
                  <div className="text-[10px] text-slate-500">
                    {DEMO_USERS.pegawai.nama.split(",")[0]}
                  </div>
                </div>
                {user?.role === "pegawai" && (
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                )}
              </button>
              <button
                onClick={() => handleSelectRole("atasan")}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between text-slate-700 hover:text-blue-800"
              >
                <div>
                  <div className="font-semibold">Atasan Langsung / Kabid</div>
                  <div className="text-[10px] text-slate-500">
                    {DEMO_USERS.atasan.nama.split(",")[0]}
                  </div>
                </div>
                {user?.role === "atasan" && (
                  <UserCheck className="w-4 h-4 text-blue-600" />
                )}
              </button>
              <button
                onClick={() => handleSelectRole("admin")}
                className="w-full text-left px-3 py-2 hover:bg-red-50 flex items-center justify-between text-slate-700 hover:text-red-800"
              >
                <div>
                  <div className="font-semibold">Admin Kepegawaian</div>
                  <div className="text-[10px] text-slate-500">BKPSDM Utama</div>
                </div>
                {user?.role === "admin" && (
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* User Profile Card in Header */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <Avatar
            fallback={user?.nama ? user.nama.substring(0, 2).toUpperCase() : "AS"}
            size="md"
          />
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-900 leading-tight">
              {user?.nama || "Pegawai ASN"}
            </div>
            <div className="text-[10px] text-slate-500 leading-tight">
              NIP: {user?.nip || "-"} • {user?.golongan?.split(" - ")[0]}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-slate-500 hover:text-red-600 hover:bg-red-50 h-9 px-2.5"
          title="Keluar Akun"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
