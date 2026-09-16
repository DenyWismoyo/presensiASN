"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NetworkSentinel() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Inisialisasi status koneksi awal
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      role="alert"
      className={cn(
        "sticky top-0 z-50 w-full px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all duration-300 animate-in slide-in-from-top",
        !isOnline
          ? "bg-red-600 text-white border-b border-red-700"
          : "bg-emerald-600 text-white border-b border-emerald-700"
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
          <span>
            Koneksi Internet Terputus — Pastikan sinyal data/Wi-Fi aktif untuk presensi GPS & upload foto.
          </span>
        </>
      ) : (
        <>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Koneksi Internet Pulih Kembali — Sinkronisasi cloud aktif.</span>
        </>
      )}
    </div>
  );
}
