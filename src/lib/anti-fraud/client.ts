/**
 * Anti-Fraud Suite (Client Side) untuk Presensi ASN
 * Meliputi: Stempel Digital Forensik (Watermark Canvas), Analisis Kecerahan/Lensa Tertutup,
 * Deteksi Wajah Native, dan Integritas GPS Mocking.
 */

export interface WatermarkMetadata {
  nip: string;
  nama: string;
  namaKantor: string;
  koordinat: { lat: number; lng: number };
  waktu?: Date | string;
  accuracyMeter?: number;
}

/**
 * Mencap (*burn-in*) stempel forensik digital langsung ke pixel array canvas sebelum diunggah ke storage.
 * Menjadikan data kehadiran (NIP, Waktu, Koordinat, Lokasi) permanen pada gambar JPEG.
 */
export function stampOfficialWatermark(
  canvas: HTMLCanvasElement,
  metadata: WatermarkMetadata
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { nip, nama, namaKantor, koordinat, accuracyMeter } = metadata;
  const w = canvas.width;
  const h = canvas.height;

  // Ukuran bar informasi disesuaikan dengan resolusi canvas (skala proporsional)
  const barHeight = Math.max(90, Math.round(h * 0.16));
  const barY = h - barHeight;

  ctx.save();

  // 1. Background overlay semi-transparan gelap di dasar foto
  const gradient = ctx.createLinearGradient(0, barY, 0, h);
  gradient.addColorStop(0, "rgba(15, 23, 42, 0.75)"); // Slate 900
  gradient.addColorStop(1, "rgba(2, 6, 23, 0.95)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, barY, w, barHeight);

  // 2. Garis aksen emas/hijau emerald di bagian atas bar
  ctx.fillStyle = "#10b981"; // Emerald 500
  ctx.fillRect(0, barY, w, Math.max(3, Math.round(h * 0.005)));

  // 3. Konfigurasi Teks
  const fontSizeHeader = Math.max(12, Math.round(barHeight * 0.16));
  const fontSizeBody = Math.max(11, Math.round(barHeight * 0.14));
  const paddingX = Math.max(16, Math.round(w * 0.03));

  const waktuDate = metadata.waktu ? new Date(metadata.waktu) : new Date();
  const waktuStr =
    waktuDate.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    " " +
    waktuDate.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) +
    " WIB";

  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  // Baris 1: Instansi & Sistem
  ctx.font = `bold ${fontSizeHeader}px "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = "#34d399"; // Emerald 400
  const row1Y = barY + Math.round(barHeight * 0.28);
  ctx.fillText("PEMERINTAH KOTA SURAKARTA • PRESENSI RESMI ASN", paddingX, row1Y);

  // Baris 2: Identitas Pegawai & Kantor
  ctx.font = `600 ${fontSizeBody}px "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = "#ffffff";
  const row2Y = barY + Math.round(barHeight * 0.55);
  ctx.fillText(
    `Pegawai: ${nama} (NIP: ${nip}) | Unit: ${namaKantor}`,
    paddingX,
    row2Y
  );

  // Baris 3: Koordinat GPS, Akurasi, dan Waktu
  ctx.font = `normal ${Math.max(10, fontSizeBody - 1)}px "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = "#cbd5e1"; // Slate 300
  const row3Y = barY + Math.round(barHeight * 0.82);
  const accText = accuracyMeter ? ` (±${Math.round(accuracyMeter)}m)` : "";
  ctx.fillText(
    `Koordinat: ${koordinat.lat.toFixed(6)}, ${koordinat.lng.toFixed(6)}${accText} • ${waktuStr}`,
    paddingX,
    row3Y
  );

  ctx.restore();
}

/**
 * Menganalisis kecerahan rata-rata foto untuk mencegah kecurangan
 * seperti menutup lensa dengan lakban atau memotret bidang gelap pekat.
 */
export function analyzePhotoLuminosity(canvas: HTMLCanvasElement): {
  isValid: boolean;
  luminosity: number;
  reason?: string;
} {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { isValid: true, luminosity: 128 };

  const w = canvas.width;
  const h = canvas.height;
  // Sample area tengah (mengabaikan bar watermark)
  const sampleHeight = Math.round(h * 0.7);
  const imgData = ctx.getImageData(0, 0, w, sampleHeight);
  const data = imgData.data;

  let totalLuminance = 0;
  const totalPixels = data.length / 4;

  // Step sampling untuk efisiensi performa
  const step = 4;
  let sampledCount = 0;

  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Formula ITU-R BT.709 standar kecerahan perseptual manusia
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    totalLuminance += lum;
    sampledCount++;
  }

  const avgLuminance = sampledCount > 0 ? totalLuminance / sampledCount : 128;

  // Ambang batas: < 20 terlalu gelap/lensa ditutup; > 245 silau/putih buatan pekat
  if (avgLuminance < 20) {
    return {
      isValid: false,
      luminosity: avgLuminance,
      reason:
        "Kamera terdeteksi terlalu gelap atau lensa kamera tertutup. Harap ambil swafoto di tempat dengan pencahayaan yang cukup.",
    };
  }

  if (avgLuminance > 248) {
    return {
      isValid: false,
      luminosity: avgLuminance,
      reason:
        "Kamera terdeteksi silau ekstrem atau tertutup cahaya putih. Harap arahkan kamera langsung ke wajah Anda.",
    };
  }

  return { isValid: true, luminosity: avgLuminance };
}

/**
 * Mendeteksi wajah manusia jika didukung oleh browser secara native (Chromium/Android FaceDetector API).
 */
export async function detectFaceIfSupported(canvas: HTMLCanvasElement): Promise<{
  supported: boolean;
  faceCount?: number;
  hasFace?: boolean;
}> {
  if (typeof window === "undefined" || !("FaceDetector" in window)) {
    return { supported: false };
  }

  try {
    const FaceDetectorClass = (window as unknown as { FaceDetector: new (opts?: { fastMode?: boolean; maxDetectedFaces?: number }) => { detect: (src: CanvasImageSource) => Promise<unknown[]> } }).FaceDetector;
    const detector = new FaceDetectorClass({ fastMode: true, maxDetectedFaces: 5 });
    const faces = await detector.detect(canvas);
    return {
      supported: true,
      faceCount: faces.length,
      hasFace: faces.length > 0,
    };
  } catch (err) {
    console.warn("[AntiFraud FaceDetector Error]:", err);
    return { supported: false };
  }
}

/**
 * Memeriksa integritas satelit GPS klien (deteksi Mock Location dan akurasi rendah).
 */
export function checkGpsIntegrity(position: GeolocationPosition): {
  isValid: boolean;
  isMock: boolean;
  accuracy: number;
  warning?: string;
} {
  const coords = position.coords;
  const accuracy = coords.accuracy;

  // Cek flag mock location Android/browser jika tersedia
  const isMock = Boolean(
    (coords as unknown as { isMock?: boolean }).isMock ||
    (position as unknown as { mocked?: boolean }).mocked
  );

  if (isMock) {
    return {
      isValid: false,
      isMock: true,
      accuracy,
      warning:
        "PERINGATAN ANTI-FRAUD: Terdeteksi aplikasi Mock Location (Fake GPS) aktif pada perangkat Anda. Presensi ditolak demi integritas data kepegawaian.",
    };
  }

  // Jika akurasi > 250 meter, sinyal kemungkinan hanya triangulasi BTS kasar
  if (accuracy > 250) {
    return {
      isValid: true,
      isMock: false,
      accuracy,
      warning: `Akurasi sinyal GPS perangkat lemah (±${Math.round(accuracy)}m). Disarankan berada di luar ruangan untuk akurasi radius maksimal.`,
    };
  }

  return {
    isValid: true,
    isMock: false,
    accuracy,
  };
}
