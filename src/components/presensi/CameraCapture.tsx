"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Check, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { uploadAsnFile } from "@/lib/firebase/storage-helpers";
import {
  stampOfficialWatermark,
  analyzePhotoLuminosity,
  detectFaceIfSupported,
} from "@/lib/anti-fraud/client";

interface CameraCaptureProps {
  mode?: 'check-in' | 'check-out' | 'lembur-in' | 'lembur-out';
  userId: string;
  orgId: string;
  onCapture: (fotoUrl: string, sizeBytes: number) => void;
  onRetake?: () => void;
  allowRetake?: boolean;
  requireFace?: boolean;
  onError?: (message: string) => void;
  capturedUrl?: string | null; // Foto yang sudah diambil sebelumnya
  nip?: string;
  nama?: string;
  namaKantor?: string;
  koordinat?: { lat: number; lng: number } | null;
  accuracyMeter?: number;
}

type CameraState =
  | "requesting"   // Meminta izin kamera
  | "streaming"    // Kamera aktif, siap foto
  | "capturing"    // Sedang proses ambil foto
  | "uploading"    // Sedang upload ke Firebase Storage
  | "captured"     // Foto berhasil diambil dan diupload
  | "error";       // Error kamera atau upload

/**
 * Komponen kamera selfie ASN yang sesungguhnya.
 * Menggunakan getUserMedia() untuk akses kamera perangkat,
 * mengambil snapshot dari video stream, lalu mengupload ke Firebase Storage.
 */
export default function CameraCapture({
  mode = "check-in",
  userId,
  orgId,
  onCapture,
  onRetake,
  allowRetake = true,
  requireFace = true,
  onError,
  capturedUrl,
  nip,
  nama,
  namaKantor,
  koordinat,
  accuracyMeter,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const [cameraState, setCameraState] = useState<CameraState>(
    capturedUrl ? "captured" : "requesting"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(capturedUrl || null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraState("requesting");
    setErrorMessage("");

    try {
      // Prioritaskan kamera depan (selfie) untuk presensi
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraState("streaming");
      }
    } catch (err) {
      const error = err as Error;
      let msg = "Kamera tidak dapat diakses.";

      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        msg = "Izin kamera ditolak. Harap aktifkan izin kamera di pengaturan browser Anda, lalu muat ulang halaman.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        msg = "Kamera tidak ditemukan pada perangkat ini.";
      } else if (error.name === "NotReadableError") {
        msg = "Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi lain dan coba lagi.";
      } else if (error.name === "OverconstrainedError") {
        // Fallback ke kamera manapun jika kamera depan tidak tersedia
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play();
            setCameraState("streaming");
            return;
          }
        } catch {
          msg = "Tidak ada kamera yang tersedia pada perangkat ini.";
        }
      }

      setErrorMessage(msg);
      setCameraState("error");
      onError?.(msg);
    }
  }, [onError]);

  useEffect(() => {
    if (!capturedUrl) {
      startCamera();
    }

    // Cleanup: hentikan stream kamera saat komponen unmount
    return () => {
      stopCamera();
    };
  }, [capturedUrl, startCamera, stopCamera]);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || cameraState !== "streaming") return;

    setCameraState("capturing");

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setErrorMessage("Gagal mengakses canvas untuk mengambil foto.");
      setCameraState("error");
      return;
    }

    // Dapatkan aspect ratio kontainer UI agar hasil foto persis seperti yang dilihat pengguna
    const targetAspect = previewContainerRef.current 
      ? previewContainerRef.current.clientWidth / previewContainerRef.current.clientHeight 
      : 3 / 4;

    const videoAspect = video.videoWidth / video.videoHeight;
    
    let sourceWidth = video.videoWidth;
    let sourceHeight = video.videoHeight;
    let sourceX = 0;
    let sourceY = 0;

    if (videoAspect > targetAspect) {
      // Video lebih lebar dari kontainer (crop kiri-kanan)
      sourceWidth = video.videoHeight * targetAspect;
      sourceX = (video.videoWidth - sourceWidth) / 2;
    } else if (videoAspect < targetAspect) {
      // Video lebih tinggi dari kontainer (crop atas-bawah)
      sourceHeight = video.videoWidth / targetAspect;
      sourceY = (video.videoHeight - sourceHeight) / 2;
    }

    // Set canvas size persis sesuai crop box
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;

    // Flip horizontal untuk selfie (mirror effect)
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
    ctx.restore();

    // 1. Anti-Fraud: Analisis Kecerahan / Lensa Tertutup
    const lumCheck = analyzePhotoLuminosity(canvas);
    if (!lumCheck.isValid) {
      const msg = lumCheck.reason || "Kamera terlalu gelap atau lensa tertutup. Harap ambil foto di tempat yang terang.";
      setErrorMessage(msg);
      setCameraState("error");
      onError?.(msg);
      return;
    }

    // 2. Anti-Fraud: Deteksi Wajah Human Liveness jika didukung browser
    const faceCheck = await detectFaceIfSupported(canvas);
    if (requireFace && faceCheck.supported && !faceCheck.hasFace) {
      const msg = "FRAUD_ALERT: Wajah tidak terdeteksi. Harap pastikan wajah Anda terlihat jelas dalam frame kamera.";
      setErrorMessage(msg);
      setCameraState("error");
      onError?.(msg);
      // Restart camera so they can try again
      startCamera();
      return;
    }

    // 3. Anti-Fraud: Stempel Forensik Digital Resmi ASN (Watermark Burn-In)
    if (nama && koordinat) {
      stampOfficialWatermark(canvas, {
        nip,
        nama,
        namaKantor: namaKantor || "Kantor Pusat",
        koordinat,
        waktu: new Date(),
        accuracyMeter,
      });
    }

    // Hentikan stream kamera setelah foto diambil dan dicap stempel forensik
    stopCamera();

    // Convert canvas ke Blob (JPEG, kualitas 0.85)
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setErrorMessage("Gagal mengambil foto. Coba lagi.");
          setCameraState("streaming");
          startCamera();
          return;
        }

        const localPreviewUrl = URL.createObjectURL(blob);
        setPreviewUrl(localPreviewUrl);
        setCameraState("uploading");

        // Upload ke Firebase Storage
        try {
          const fileName = `presensi_${userId}_${Date.now()}.jpg`;
          const metadata = await uploadAsnFile({
            file: blob,
            fileName,
            userId,
            orgId,
            type: "foto",
          });

          setCameraState("captured");
          onCapture(metadata.url, blob.size);
        } catch (uploadErr) {
          const uploadError = uploadErr as Error;
          setErrorMessage(`Gagal mengupload foto: ${uploadError.message}`);
          setCameraState("error");
          onError?.(uploadError.message);
        }
      },
      "image/jpeg",
      0.85
    );
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const [dragX, setDragX] = useState(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (cameraState !== "streaming") return;
    isDragging.current = true;
    startX.current = e.clientX - dragX;
    if (e.target instanceof HTMLElement) {
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const knobWidth = 56; // w-14 is 56px
    const maxDrag = containerRect.width - knobWidth - 8;

    let newX = e.clientX - startX.current;
    if (newX < 0) newX = 0;
    if (newX > maxDrag) newX = maxDrag;
    
    setDragX(newX);

    if (newX >= maxDrag * 0.95) {
      isDragging.current = false;
      setDragX(maxDrag);
      handleCapture();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (cameraState === "streaming") {
      setDragX(0);
    }
    if (e.target instanceof HTMLElement) {
      e.target.releasePointerCapture(e.pointerId);
    }
  };

  useEffect(() => {
    if (cameraState === "streaming") {
      setDragX(0);
    } else if (cameraState === "captured" || cameraState === "capturing" || cameraState === "uploading") {
      if (containerRef.current) {
        const maxDrag = containerRef.current.getBoundingClientRect().width - 56 - 8;
        if (maxDrag > 0) setDragX(maxDrag);
      }
    }
  }, [cameraState]);

  return (
    <div className="space-y-5">
      {/* Canvas tersembunyi untuk capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Area Kamera / Preview */}
      <div 
        ref={previewContainerRef}
        className="relative aspect-[3/4] sm:aspect-[4/5] max-h-[500px] w-full rounded-none sm:rounded-3xl bg-slate-900 flex flex-col items-center justify-center overflow-hidden shadow-none sm:shadow-2xl mx-auto border-y sm:border-[6px] sm:border-white/60"
      >

        {/* Video Stream */}
        {(cameraState === "requesting" || cameraState === "streaming" || cameraState === "capturing") && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${cameraState === "requesting" ? "hidden" : ""}`}
              style={{ transform: "scaleX(-1)" }} // Mirror selfie
            />
            {/* Overlay: Face Guide Oval */}
            {cameraState === "streaming" && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                <div className="w-[65%] h-[55%] border-2 border-dashed border-white/60 rounded-[100%] shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              </div>
            )}
          </>
        )}

        {/* Preview Foto yang Sudah Diambil */}
        {(cameraState === "uploading" || cameraState === "captured") && previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Swafoto Presensi"
            className="w-full h-full object-cover"
          />
        )}

        {/* Loading: Meminta Izin Kamera */}
        {cameraState === "requesting" && (
          <div className="text-center p-6 space-y-3 z-10">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-300 font-medium">Meminta akses kamera...</p>
          </div>
        )}

        {/* Error State */}
        {cameraState === "error" && (
          <div className="text-center p-6 space-y-3 max-w-xs mx-auto z-10 bg-slate-900/80 backdrop-blur-md rounded-2xl">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <p className="text-sm font-semibold text-rose-300">Akses Ditolak</p>
            <p className="text-xs text-slate-400 leading-relaxed">{errorMessage}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={startCamera}
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/50 rounded-full mt-2"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        )}

        {/* Overlay: Uploading */}
        {cameraState === "uploading" && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
            <p className="text-sm font-bold text-white tracking-wide">MENGUPLOAD...</p>
          </div>
        )}

        {/* Metadata Overlay */}
        {(cameraState === "streaming" || cameraState === "captured") && (
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[11px] text-white z-10">
             <div className="px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10 shadow-sm flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${cameraState === "streaming" ? "bg-emerald-400 animate-pulse" : "bg-emerald-400"}`} />
               <span className="font-semibold tracking-wide">
                 {cameraState === "captured" ? "TERVERIFIKASI" : "KAMERA AKTIF"}
               </span>
             </div>
             {cameraState === "captured" && (
               <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg border-2 border-emerald-400">
                 <Check className="w-4 h-4 text-white" />
               </div>
             )}
          </div>
        )}
      </div>

      {/* Swipe Action Button */}
      <div className="px-4 sm:px-0">
        {cameraState !== "captured" ? (
        <div 
          ref={containerRef}
          className={`relative w-full h-[68px] rounded-[24px] bg-slate-100 overflow-hidden border-2 border-white shadow-sm select-none ${cameraState !== "streaming" ? 'opacity-70 pointer-events-none' : ''}`}
          style={{ touchAction: 'none' }}
        >
          {/* Background fill */}
          <div 
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-[22px]"
            style={{ 
              width: `${dragX + 68}px`, // base width matching knob roughly
              transition: isDragging.current ? 'none' : 'width 0.3s ease' 
            }}
          />
          
          {/* Text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <span className={`font-extrabold text-[12px] tracking-widest transition-colors duration-300 ${(cameraState === "capturing" || cameraState === "uploading") ? 'text-white' : dragX > 40 ? 'text-white/90' : 'text-slate-500'}`}>
              {cameraState === "capturing" || cameraState === "uploading" ? "MEMPROSES..." : 
               mode === 'check-out' || mode === 'lembur-out' ? "SWIPE UNTUK PULANG" : 
               "SWIPE UNTUK FOTO"}
            </span>
          </div>

          {/* Knob */}
          <div 
            className="absolute left-1.5 top-1.5 bottom-1.5 w-14 rounded-[18px] bg-white shadow-sm flex items-center justify-center cursor-grab active:cursor-grabbing z-20 border border-slate-100"
            style={{ 
              transform: `translateX(${dragX}px)`,
              transition: isDragging.current ? 'none' : 'transform 0.3s ease'
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {cameraState === "capturing" || cameraState === "uploading" ? (
              <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-slate-700" />
            )}
          </div>
        </div>
      ) : (
        <div className="w-full flex gap-3">
          <div className="flex-1 h-[68px] rounded-[24px] bg-emerald-50 border-2 border-emerald-100/50 shadow-sm flex items-center justify-center text-emerald-700">
            <Check className="w-5 h-5 mr-2" />
            <span className="font-extrabold text-[12px] tracking-widest">FOTO BERHASIL</span>
          </div>
          {allowRetake && onRetake && (
            <Button
              variant="outline"
              className="h-[68px] rounded-[24px] px-6 text-slate-500 border-2 border-slate-200"
              onClick={() => {
                setCameraState("requesting");
                setPreviewUrl(null);
                onRetake();
                startCamera();
              }}
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
