"use client";

import React, { Suspense } from "react";
import AttendanceHub from "@/components/presensi/AttendanceHub";
import { Loader2 } from "lucide-react";

export default function PresensiPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    }>
      <AttendanceHub />
    </Suspense>
  );
}
