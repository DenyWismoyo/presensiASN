"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface MobilePageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  rightElement?: React.ReactNode;
}

export default function MobilePageHeader({
  title,
  subtitle,
  backHref = "/",
  backLabel = "Beranda",
  rightElement,
}: MobilePageHeaderProps) {
  return (
    <div className="md:hidden mb-4 p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <Link
          href={backHref}
          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 transition-colors active:scale-95"
          title={`Kembali ke ${backLabel}`}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-xs font-bold text-slate-900 truncate leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {rightElement && <div className="shrink-0">{rightElement}</div>}
    </div>
  );
}
