"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import BottomNav from "@/components/dashboard/BottomNav";
import NetworkSentinel from "@/components/dashboard/NetworkSentinel";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Setelah loading selesai, jika tidak ada user → redirect ke login
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  // Tampilkan loading state saat inisialisasi Firebase Auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Memverifikasi sesi ASN...</p>
        </div>
      </div>
    );
  }

  // Jika tidak ada user setelah loading → jangan render apapun (sedang redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <NetworkSentinel />
        <Header />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 pb-24 md:pb-8">
          {children}
        </main>
        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}
