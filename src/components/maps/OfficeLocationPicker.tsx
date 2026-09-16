"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation, MapPin, ZoomIn, ZoomOut, Compass } from "lucide-react";

interface OfficeLocationPickerProps {
  initialLat: number;
  initialLng: number;
  radiusMeter: number;
  namaKantor?: string;
  onChange: (lat: number, lng: number) => void;
  className?: string;
}

/**
 * Custom SVG DivIcon Marker Pin modern ASN (Emerald Theme)
 */
function createCustomPinIcon(label: string = "Titik Kantor") {
  const html = `
    <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full cursor-pointer group">
      <div class="absolute -bottom-1 w-3 h-3 bg-emerald-950/40 rounded-full blur-[2px]"></div>
      <div class="w-9 h-9 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white transition-transform group-hover:scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div class="absolute -top-7 whitespace-nowrap px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold shadow opacity-90 pointer-events-none">
        ${label}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-office-pin",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
}

export default function OfficeLocationPicker({
  initialLat,
  initialLng,
  radiusMeter,
  namaKantor = "Titik Kantor",
  onChange,
  className = "",
}: OfficeLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat || -7.558392,
    lng: initialLng || 110.857528,
  });
  const [isLocating, setIsLocating] = useState(false);

  // Inisialisasi peta Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Mencegah inisialisasi ganda

    const map = L.map(mapContainerRef.current, {
      center: [currentCoords.lat, currentCoords.lng],
      zoom: 16,
      zoomControl: false, // Gunakan kontrol kustom
    });

    // Tile Layer: OpenStreetMap Standard yang jernih dan gratis
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Tambahkan Circle Geofence radius
    const circle = L.circle([currentCoords.lat, currentCoords.lng], {
      radius: radiusMeter || 150,
      color: "#059669", // Emerald 600
      fillColor: "#10b981", // Emerald 500
      fillOpacity: 0.22,
      weight: 2,
      dashArray: "4, 6",
    }).addTo(map);
    circleRef.current = circle;

    // Tambahkan Marker Pin Draggable
    const marker = L.marker([currentCoords.lat, currentCoords.lng], {
      icon: createCustomPinIcon(namaKantor),
      draggable: true,
      autoPan: true,
    }).addTo(map);
    markerRef.current = marker;

    // Event: saat pin selesai di-drag
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      const newLat = parseFloat(pos.lat.toFixed(6));
      const newLng = parseFloat(pos.lng.toFixed(6));
      setCurrentCoords({ lat: newLat, lng: newLng });
      circle.setLatLng(pos);
      onChange(newLat, newLng);
    });

    // Event: saat user mengklik area peta manapun
    map.on("click", (e: L.LeafletMouseEvent) => {
      const newLat = parseFloat(e.latlng.lat.toFixed(6));
      const newLng = parseFloat(e.latlng.lng.toFixed(6));
      marker.setLatLng(e.latlng);
      circle.setLatLng(e.latlng);
      setCurrentCoords({ lat: newLat, lng: newLng });
      onChange(newLat, newLng);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sinkronisasi radius ketika prop radiusMeter berubah dari slider/input
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radiusMeter || 150);
    }
  }, [radiusMeter]);

  // Sinkronisasi posisi jika prop initialLat / initialLng berubah dari luar
  useEffect(() => {
    if (
      initialLat &&
      initialLng &&
      (initialLat !== currentCoords.lat || initialLng !== currentCoords.lng)
    ) {
      setCurrentCoords({ lat: initialLat, lng: initialLng });
      if (markerRef.current && circleRef.current && mapInstanceRef.current) {
        const newPos = L.latLng(initialLat, initialLng);
        markerRef.current.setLatLng(newPos);
        circleRef.current.setLatLng(newPos);
        mapInstanceRef.current.panTo(newPos, { animate: true, duration: 0.5 });
      }
    }
  }, [initialLat, initialLng]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tombol: Gunakan Lokasi GPS Saya Saat Ini
  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Browser tidak mendukung GPS.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const newLat = parseFloat(pos.coords.latitude.toFixed(6));
        const newLng = parseFloat(pos.coords.longitude.toFixed(6));
        setCurrentCoords({ lat: newLat, lng: newLng });

        if (markerRef.current && circleRef.current && mapInstanceRef.current) {
          const latlng = L.latLng(newLat, newLng);
          markerRef.current.setLatLng(latlng);
          circleRef.current.setLatLng(latlng);
          mapInstanceRef.current.setView(latlng, 17, { animate: true });
        }
        onChange(newLat, newLng);
      },
      (err) => {
        setIsLocating(false);
        alert(`Gagal membaca GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [onChange]);

  return (
    <div className={`relative flex flex-col rounded-xl overflow-hidden border border-slate-300 shadow-sm bg-slate-900 ${className}`}>
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <Badge className="bg-slate-900/90 text-white hover:bg-slate-900 border border-slate-700 text-[11px] font-mono shadow-md backdrop-blur-sm px-2.5 py-1">
            <MapPin className="w-3 h-3 mr-1 text-emerald-400" />
            {currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}
          </Badge>
          <Badge className="bg-emerald-600/90 text-white hover:bg-emerald-600 border border-emerald-500 text-[11px] font-semibold shadow-md backdrop-blur-sm px-2.5 py-1">
            Radius: {radiusMeter}m
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          <Button
            type="button"
            size="sm"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="bg-white/95 hover:bg-white text-slate-800 text-[11px] h-8 px-2.5 shadow-md font-semibold border border-slate-200"
          >
            <Navigation className={`w-3.5 h-3.5 mr-1 text-emerald-600 ${isLocating ? "animate-spin" : ""}`} />
            {isLocating ? "Mencari GPS..." : "Lokasi Saya"}
          </Button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white text-slate-800 flex items-center justify-center shadow-md border border-slate-200"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white text-slate-800 flex items-center justify-center shadow-md border border-slate-200"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Kontainer Kanvas Peta Leaflet */}
      <div ref={mapContainerRef} className="w-full h-[360px] z-0" />

      {/* Bottom Hint */}
      <div className="bg-slate-900 text-slate-300 px-3 py-1.5 text-[11px] flex items-center justify-between border-t border-slate-800">
        <span>💡 Geser pin hijau atau klik peta untuk memindahkan titik pusat kantor.</span>
        <span className="font-mono text-emerald-400 font-medium">OpenStreetMap</span>
      </div>
    </div>
  );
}
