"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import TabAbsensi from "./TabAbsensi";
import TabLembur from "./TabLembur";
import TabIzin from "./TabIzin";
import TabRiwayat from "./TabRiwayat";
import { Fingerprint, Timer, FileText, History } from "lucide-react";

export default function AttendanceHub() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTab = searchParams.get("tab") || "absensi";

  const tabs = [
    { id: "absensi", label: "Absensi", icon: Fingerprint },
    { id: "lembur", label: "Lembur", icon: Timer },
    { id: "izin", label: "Izin", icon: FileText },
    { id: "riwayat", label: "Riwayat", icon: History },
  ];

  const setTab = (id: string) => {
    router.push(`/presensi?tab=${id}`);
  };

  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [startY, setStartY] = React.useState(0);
  const [pullDistance, setPullDistance] = React.useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY > 0) {
      const currentY = e.touches[0].clientY;
      const dist = currentY - startY;
      if (dist > 0 && dist < 100) {
        setPullDistance(dist);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      setIsRefreshing(true);
      if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(20);
      await queryClient.invalidateQueries();
      setTimeout(() => setIsRefreshing(false), 500);
    }
    setStartY(0);
    setPullDistance(0);
  };

  return (
    <div 
      className="flex flex-col relative w-full h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div 
        className="absolute w-full flex justify-center overflow-hidden transition-all duration-200"
        style={{ height: pullDistance > 0 ? `${pullDistance}px` : '0px' }}
      >
        <div className="mt-4 bg-white rounded-full p-2 shadow-md flex items-center justify-center">
          <Loader2 className={`w-5 h-5 text-emerald-500 ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 2}deg)` }} />
        </div>
      </div>

      {/* Sticky Tab Bar */}
      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 p-2 flex justify-between gap-1 shadow-sm mx-0 sm:rounded-2xl sm:border sm:mt-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl text-[11px] font-bold tracking-wide transition-all ${
              currentTab === t.id
                ? "bg-primary/10 text-primary shadow-sm border border-primary/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <t.icon className={`w-5 h-5 ${currentTab === t.id ? 'mb-0.5' : ''}`} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto pt-4 sm:pt-6">
        {currentTab === "absensi" && <TabAbsensi />}
        {currentTab === "lembur" && <TabLembur />}
        {currentTab === "izin" && <TabIzin />}
        {currentTab === "riwayat" && <TabRiwayat />}
      </div>
    </div>
  );
}
