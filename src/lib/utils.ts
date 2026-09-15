import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// 1 ASN = 1 GB Storage = 1.073.741.824 bytes
export const DEFAULT_STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024; // 1 GB

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function calculateStorageQuota(
  usedBytes: number,
  limitBytes: number = DEFAULT_STORAGE_LIMIT_BYTES
) {
  const percentage = Math.min(100, Math.round((usedBytes / limitBytes) * 1000) / 10);
  const remainingBytes = Math.max(0, limitBytes - usedBytes);
  const isNearlyFull = percentage >= 85;
  const isFull = percentage >= 100;

  let colorClass = "from-emerald-500 to-teal-600";
  let statusBadgeVariant: "default" | "warning" | "destructive" = "default";
  let statusText = "Tersedia Aman";

  if (isFull) {
    colorClass = "from-red-600 to-rose-700";
    statusBadgeVariant = "destructive";
    statusText = "Kapasitas Penuh (100%)";
  } else if (isNearlyFull) {
    colorClass = "from-amber-500 to-orange-600";
    statusBadgeVariant = "warning";
    statusText = "Mendekati Batas (85%+)";
  }

  return {
    percentage,
    remainingBytes,
    isNearlyFull,
    isFull,
    colorClass,
    statusBadgeVariant,
    statusText,
    usedFormatted: formatBytes(usedBytes),
    limitFormatted: formatBytes(limitBytes),
    remainingFormatted: formatBytes(remainingBytes),
  };
}
