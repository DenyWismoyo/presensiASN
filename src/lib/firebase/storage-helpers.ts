import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";
import { UploadedFileMetadata } from "@/types";

export interface UploadFileOptions {
  file: File | Blob;
  fileName: string;
  userId: string;
  orgId: string;
  type: "foto" | "dokumen";
  kegiatanId?: string;
  kegiatanDeskripsi?: string;
}

/**
 * Membuat struktur path penyimpanan hierarkis resmi ASN:
 * /presensi-pegawai/{orgId}/{userId}/{year}/{month}/{uniqueFilename}
 */
export function generateAsnStoragePath(
  orgId: string,
  userId: string,
  fileName: string
): string {
  const rootFolder = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_FOLDER || "presensi-pegawai";
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniquePrefix = Date.now().toString(36);
  return `${rootFolder}/${orgId}/${userId}/${year}/${month}/${uniquePrefix}_${cleanName}`;
}

/**
 * Upload file/swafoto presensi atau berkas LKH ke Firebase Storage.
 * Jika upload gagal → throw error ke caller (tidak ada silent fallback).
 */
export async function uploadAsnFile(
  options: UploadFileOptions
): Promise<UploadedFileMetadata> {
  const { file, fileName, userId, orgId, type, kegiatanId, kegiatanDeskripsi } = options;
  const storagePath = generateAsnStoragePath(orgId, userId, fileName);
  const nowIso = new Date().toISOString();

  const storageRef = ref(storage, storagePath);
  const snap = await uploadBytes(storageRef, file, {
    contentType: file.type || (type === "foto" ? "image/jpeg" : "application/pdf"),
  });
  const downloadUrl = await getDownloadURL(snap.ref);

  const metadata: UploadedFileMetadata = {
    id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    name: fileName,
    sizeBytes: file.size,
    mimeType: file.type || (type === "foto" ? "image/jpeg" : "application/pdf"),
    url: downloadUrl,
    uploadedAt: nowIso,
    kegiatanId,
    kegiatanDeskripsi,
    type,
  };

  return metadata;
}
