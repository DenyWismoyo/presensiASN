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
  User,
  ShieldCheck,
} from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    {
      name: "Beranda",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Presensi",
      href: "/presensi",
      icon: ClockCheck,
      isSpecial: true,
    },
    {
      name: "LKH",
      href: "/laporan",
      icon: FileSpreadsheet,
    },
    {
      name: "Profil",
      href: "/profil",
      icon: User,
    },
  ];

  return (
    <nav
      aria-label="Navigasi Bawah Ponsel"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around"
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        if (item.isSpecial) {
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center -mt-5 group"
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 border-2",
                  isActive
                    ? "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white border-white shadow-emerald-600/40 ring-2 ring-emerald-500/30"
                    : "bg-emerald-600 text-white border-white shadow-emerald-900/20 hover:bg-emerald-700"
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold mt-1 transition-colors",
                  isActive ? "text-emerald-700 font-bold" : "text-slate-600"
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
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all active:scale-95",
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
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-600" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
