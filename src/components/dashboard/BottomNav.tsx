"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { usePendingLKHList } from "@/hooks/useLKH";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClockCheck,
  FileSpreadsheet,
  User,
  ShieldCheck,
  CalendarClock,
} from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAtasanOrAdmin = user?.role === "atasan" || user?.role === "admin";
  const { data: pendingList = [] } = usePendingLKHList(isAtasanOrAdmin ? user?.orgId : undefined);
  const pendingCount = isAtasanOrAdmin ? pendingList.length : 0;

  // Navigasi 5 menu berbasis peran pengguna di perangkat mobile
  const navItems = [
    {
      name: "Beranda",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "LKH",
      href: "/laporan",
      icon: FileSpreadsheet,
    },
    {
      name: "Presensi",
      href: "/presensi",
      icon: ClockCheck,
      isSpecial: true,
    },
    isAtasanOrAdmin
      ? {
          name: "Approval",
          href: "/approval",
          icon: ShieldCheck,
          badgeCount: pendingCount,
        }
      : {
          name: "Izin / Cuti",
          href: "/izin",
          icon: CalendarClock,
        },
    {
      name: "Profil",
      href: "/profil",
      icon: User,
    },
  ];

  const handleNavClick = () => {
    // Haptic feedback lembut untuk browser ponsel yang mendukung
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // Abaikan jika tidak diizinkan oleh OS
      }
    }
  };

  return (
    <nav
      aria-label="Navigasi Bawah Ponsel"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] px-1.5 pt-1.5 pb-safe flex items-center justify-around"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        if (item.isSpecial) {
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleNavClick}
              className="flex flex-col items-center -mt-6 group"
            >
              <div
                className={cn(
                  "w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 border-2",
                  isActive
                    ? "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white border-white shadow-emerald-600/40 ring-4 ring-emerald-500/25"
                    : "bg-gradient-to-tr from-emerald-600 to-teal-700 text-white border-white shadow-emerald-900/25 hover:from-emerald-700 hover:to-teal-800"
                )}
              >
                <Icon className="w-6 h-6 animate-pulse" />
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold mt-1 transition-colors tracking-tight",
                  isActive ? "text-emerald-700" : "text-slate-700"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={handleNavClick}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all active:scale-95 min-w-[56px] relative",
              isActive
                ? "text-emerald-600 font-semibold"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <div className="relative">
              <Icon
                className={cn(
                  "w-5 h-5 transition-transform",
                  isActive && "scale-110"
                )}
              />
              {/* Badge Counter Notifikasi Khusus Menu Approval Atasan */}
              {Boolean(item.badgeCount && item.badgeCount > 0) && (
                <span className="absolute -top-1.5 -right-2.5 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-white shadow-xs animate-bounce">
                  {item.badgeCount! > 9 ? "9+" : item.badgeCount}
                </span>
              )}

              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-600" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight truncate max-w-[62px]">
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
