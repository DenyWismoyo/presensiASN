"use client";

import React from "react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface LogbookDateStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  className?: string;
}

export default function LogbookDateStrip({
  selectedDate,
  onSelectDate,
  className = "",
}: LogbookDateStripProps) {
  // Generate 7 days around selected date (-3 to +3)
  const days = Array.from({ length: 7 }, (_, i) => addDays(subDays(selectedDate, 3), i));
  const today = new Date();

  return (
    <div className={`p-2 sm:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-2 ${className}`}>
      {/* Previous Button */}
      <button
        type="button"
        onClick={() => onSelectDate(subDays(selectedDate, 1))}
        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors shrink-0"
        title="Hari Sebelumnya"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Date Pills */}
      <div className="flex-1 flex items-center justify-around gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
        {days.map((day, idx) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentToday = isSameDay(day, today);
          const dayName = format(day, "EEE", { locale: id });
          const dayNumber = format(day, "d");

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectDate(day)}
              className={`flex-1 min-w-[42px] max-w-[56px] py-1.5 sm:py-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                isSelected
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105"
                  : isCurrentToday
                  ? "bg-emerald-50 text-emerald-900 border border-emerald-300 font-semibold"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600"
              }`}
            >
              <span className={`text-[9px] uppercase tracking-wider ${isSelected ? "text-emerald-100 font-bold" : "text-slate-500"}`}>
                {dayName}
              </span>
              <span className={`text-xs sm:text-sm font-bold mt-0.5 font-mono ${isSelected ? "text-white" : "text-slate-800"}`}>
                {dayNumber}
              </span>
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        type="button"
        onClick={() => onSelectDate(addDays(selectedDate, 1))}
        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors shrink-0"
        title="Hari Berikutnya"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
