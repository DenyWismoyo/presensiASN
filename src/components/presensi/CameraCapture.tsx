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
  userId: string;
  orgId: string;
  onCapture: (fotoUrl: string, sizeBytes: number) => void;
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
  userId,
  orgId,
  onCapture,
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

    // Set canvas size sesuai video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Flip horizontal untuk selfie (mirror effect)
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
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
    if (faceCheck.supported && !faceCheck.hasFace) {
      console.warn("[AntiFraud Camera] FaceDetector tidak menemukan wajah pada canvas.");
    }

    // 3. Anti-Fraud: Stempel Forensik Digital Resmi ASN (Watermark Burn-In)
    if (nip && nama && koordinat) {
      stampOfficialWatermark(canvas, {
        nip,
        nama,
        namaKantor: namaKantor || "Solo Teknopark",
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

  const handleRetake = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setErrorMessage("");
    startCamera();
  };

  return (
    <div className="space-y-4">
      {/* Canvas tersembunyi untuk capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Area Kamera / Preview */}
      <div className="relative aspect-[3/4] sm:aspect-video max-h-[420px] sm:max-h-80 w-full rounded-2xl bg-slate-950 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center overflow-hidden shadow-inner mx-auto">

        {/* Video Stream */}
        {(cameraState === "streaming" || cameraState === "capturing") && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }} // Mirror selfie
          />
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
          <div className="text-center p-6 space-y-3">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-300">Meminta akses kamera...</p>
          </div>
        )}

        {/* Error State */}
        {cameraState === "error" && (
          <div className="text-center p-6 space-y-3 max-w-xs mx-auto">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <p className="text-sm font-semibold text-red-300">Kamera Tidak Dapat Diakses</p>
            <p className="text-xs text-slate-400 leading-relaxed">{errorMessage}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={startCamera}
              className="border-emerald-500 text-emerald-400 hover:bg-emerald-950"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        )}

        {/* Overlay: Uploading */}
        {cameraState === "uploading" && (
          <div className="absolute inset-0 bg-slate-900/70 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
            <p className="text-sm font-medium text-white">Mengupload foto ke server...</p>
          </div>
        )}

        {/* Overlay: Captured sukses */}
        {cameraState === "captured" && (
          <div className="absolute top-3 right-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
              <Check className="w-5 h-5 text-white" />
            </div>
          </div>
        )}

        {/* Metadata Overlay */}
        {(cameraState === "streaming" || cameraState === "captured") && (
          <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 flex items-center justify-between text-xs text-white">
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              {cameraState === "captured" ? "Foto terverifikasi" : "Kamera aktif — siap mengambil swafoto"}
            </span>
            {cameraState === "captured" && (
              <span className="text-emerald-300 font-medium">✓ Terupload</span>
            )}
          </div>
        )}
      </div>

      {/* Tombol Aksi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cameraState === "captured" ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleRetake}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Ambil Ulang Foto
            </Button>
            <Button
              type="button"
              disabled
              className="bg-emerald-600 text-white cursor-default"
            >
              <Check className="w-4 h-4 mr-2" />
              Foto Siap Presensi
            </Button>
          </>
        ) : (
          <Button
            type="button"
            onClick={handleCapture}
            disabled={cameraState !== "streaming"}
            className="col-span-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cameraState === "capturing" || cameraState === "uploading" ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {cameraState === "uploading" ? "Mengupload..." : "Mengambil foto..."}
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 mr-2" />
                Ambil Swafoto Presensi
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
