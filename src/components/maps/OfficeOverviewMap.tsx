"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { KantorUnit } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Building2, Layers } from "lucide-react";

interface OfficeOverviewMapProps {
  offices: KantorUnit[];
  className?: string;
}

function createOfficePinIcon(category: string, isActive: boolean) {
  const bgClass = !isActive
    ? "bg-slate-500"
    : category === "Pusat"
    ? "bg-amber-600"
    : "bg-emerald-600";

  const html = `
    <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full cursor-pointer group">
      <div class="w-7 h-7 rounded-full ${bgClass} border-2 border-white shadow-md flex items-center justify-center text-white transition-transform group-hover:scale-125">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-overview-pin",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

export default function OfficeOverviewMap({
  offices,
  className = "",
}: OfficeOverviewMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Titik pusat Kota Surakarta (Balai Kota Solo)
    const centerLat = -7.5685;
    const centerLng = 110.828;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const bounds: L.LatLngTuple[] = [];

    // Tambahkan marker dan geofence circle untuk setiap kantor
    offices.forEach((office) => {
      if (!office?.koordinat?.lat || !office?.koordinat?.lng) return;
      const latlng: L.LatLngTuple = [office.koordinat.lat, office.koordinat.lng];
      bounds.push(latlng);

      // Lingkaran geofence
      L.circle(latlng, {
        radius: office.radiusMeter || 150,
        color: office.isActive ? "#059669" : "#64748b",
        fillColor: office.isActive ? "#10b981" : "#94a3b8",
        fillOpacity: 0.18,
        weight: 1.5,
      }).addTo(map);

      // Marker
      const marker = L.marker(latlng, {
        icon: createOfficePinIcon(office.kategori, office.isActive),
      }).addTo(map);

      // Popup info
      const popupHtml = `
        <div class="p-1 font-sans text-xs">
          <div class="font-bold text-slate-900 text-sm mb-1">${office.namaKantor}</div>
          <div class="text-[11px] text-slate-600 mb-1.5">${office.alamat}</div>
          <div class="flex items-center gap-1.5 text-[10px] text-emerald-800 font-semibold mb-1">
            <span>⭕ Radius: ${office.radiusMeter} meter</span> • <span>${office.kategori}</span>
          </div>
          <div class="text-[10px] text-slate-500 font-mono">
            Lat: ${office.koordinat.lat.toFixed(5)}, Lng: ${office.koordinat.lng.toFixed(5)}
          </div>
          <div class="text-[10px] text-slate-500 mt-1">
            Jam: ${office.jamMasukMaksimal || "07:30"} - ${office.jamPulangMinimal || "16:00"} WIB
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
    });

    if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [offices]);

  return (
    <div className={`relative flex flex-col rounded-xl overflow-hidden border border-slate-200/80 shadow-sm bg-white ${className}`}>
      <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span className="font-bold">Peta Sebaran Titik Geofence ({offices.length} Kantor Aktif)</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Kantor Aktif
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Balai Kota/Pusat
          </span>
        </div>
      </div>
      <div ref={mapContainerRef} className="w-full h-[320px] z-0" />
    </div>
  );
}
