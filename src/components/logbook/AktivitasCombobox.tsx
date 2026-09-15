"use client";

import React, { useState, useMemo } from "react";
import {
  AktivitasASN,
  MASTER_AKTIVITAS_ASN,
  KATEGORI_AKTIVITAS,
} from "@/data/masterAktivitas";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  BookOpen,
  Check,
  ChevronDown,
  X,
  Sparkles,
} from "lucide-react";

interface AktivitasComboboxProps {
  selectedAktivitasId?: number;
  onSelect: (aktivitas: AktivitasASN) => void;
  className?: string;
}

export default function AktivitasCombobox({
  selectedAktivitasId,
  onSelect,
  className = "",
}: AktivitasComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKategori, setSelectedKategori] = useState<string>("Semua");

  const selectedAktivitas = useMemo(() => {
    return MASTER_AKTIVITAS_ASN.find((item) => item.id === selectedAktivitasId);
  }, [selectedAktivitasId]);

  const filteredItems = useMemo(() => {
    return MASTER_AKTIVITAS_ASN.filter((item) => {
      const matchKategori =
        selectedKategori === "Semua" || item.kategori === selectedKategori;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.nama.toLowerCase().includes(q) ||
        (item.keterangan && item.keterangan.toLowerCase().includes(q)) ||
        item.satuan.toLowerCase().includes(q);
      return matchKategori && matchSearch;
    });
  }, [searchQuery, selectedKategori]);

  const handleChoose = (item: AktivitasASN) => {
    onSelect(item);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`relative space-y-1.5 ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-left text-xs flex items-center justify-between hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
      >
        <div className="flex items-center gap-2 truncate">
          <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
          {selectedAktivitas ? (
            <div className="truncate flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 truncate">
                {selectedAktivitas.nama}
              </span>
              <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-800 border-0 shrink-0">
                +{selectedAktivitas.nilaiPoin} Poin
              </Badge>
            </div>
          ) : (
            <span className="text-slate-400">
              Pilih dari 152 Kamus Master Aktivitas ASN...
            </span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
      </button>

      {/* Dropdown Modal / Picker */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl bg-white border border-slate-200 shadow-2xl p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-100 max-h-[380px] flex flex-col">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <Input
              type="text"
              placeholder="Cari aktivitas (misal: verifikasi, koordinasi, rapat, laporan)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-9"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-1 overflow-x-auto pb-1 text-[10px] no-scrollbar">
            {KATEGORI_AKTIVITAS.map((kat) => (
              <button
                key={kat}
                type="button"
                onClick={() => setSelectedKategori(kat)}
                className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  selectedKategori === kat
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {kat}
              </button>
            ))}
          </div>

          {/* Activity List Items */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Tidak ada aktivitas yang sesuai dengan kata kunci &quot;{searchQuery}&quot;.
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = item.id === selectedAktivitasId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleChoose(item)}
                    className={`w-full text-left p-2 rounded-lg flex items-center justify-between text-xs transition-colors group ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-950 font-semibold"
                        : "hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-slate-400">
                          #{item.id}
                        </span>
                        <span className="truncate">{item.nama}</span>
                        {item.kategori && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-medium">
                            {item.kategori}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Satuan: {item.satuan}{" "}
                        {item.keterangan ? `• ${item.keterangan}` : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        variant="default"
                        className="text-[10px] bg-emerald-100 text-emerald-800 border-0"
                      >
                        +{item.nilaiPoin} Poin
                      </Badge>
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-600 ml-1" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Close button */}
          <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Ditemukan: {filteredItems.length} dari 152 aktivitas</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-600 font-semibold hover:underline"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
