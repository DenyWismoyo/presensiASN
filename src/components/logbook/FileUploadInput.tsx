"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileImage, FileText, X, Check, Loader2, AlertCircle } from "lucide-react";
import { uploadAsnFile } from "@/lib/firebase/storage-helpers";
import { UploadedFileMetadata } from "@/types";

interface FileUploadInputProps {
  userId: string;
  orgId: string;
  accept?: string;
  type: "foto" | "dokumen";
  label?: string;
  maxSizeMB?: number;
  kegiatanDeskripsi?: string;
  onUploaded: (metadata: UploadedFileMetadata) => void;
  onError?: (message: string) => void;
  onStorageCheck?: (bytes: number) => boolean; // Return false jika kuota habis
}

type UploadState = "idle" | "uploading" | "done" | "error";

/**
 * Komponen upload file LKH yang sesungguhnya.
 * Menggunakan <input type="file"> nyata untuk memilih file dari perangkat,
 * lalu mengupload ke Firebase Storage dan mengembalikan download URL yang valid.
 */
export default function FileUploadInput({
  userId,
  orgId,
  accept,
  type,
  label,
  maxSizeMB = 10,
  kegiatanDeskripsi,
  onUploaded,
  onError,
  onStorageCheck,
}: FileUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<UploadedFileMetadata | null>(null);
  const [progress, setProgress] = useState<string>("");

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const defaultAccept =
    type === "foto"
      ? "image/jpeg,image/png,image/webp,image/heic"
      : "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage("");

    // Validasi ukuran file
    if (file.size > maxSizeBytes) {
      const msg = `Ukuran file terlalu besar. Maksimum ${maxSizeMB} MB, file Anda: ${(file.size / 1024 / 1024).toFixed(1)} MB.`;
      setErrorMessage(msg);
      setUploadState("error");
      onError?.(msg);
      // Reset input agar file yang sama bisa dipilih lagi
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    // Validasi kuota storage user (opsional)
    if (onStorageCheck && !onStorageCheck(file.size)) {
      const msg = `Kapasitas penyimpanan Anda tidak mencukupi untuk mengunggah file ini (${(file.size / 1024 / 1024).toFixed(1)} MB).`;
      setErrorMessage(msg);
      setUploadState("error");
      onError?.(msg);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploadState("uploading");
    setProgress(`Mengupload ${file.name}...`);

    try {
      const fileName = `${type}_${userId}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const metadata = await uploadAsnFile({
        file,
        fileName,
        userId,
        orgId,
        type,
        kegiatanDeskripsi,
      });

      setUploadedFile(metadata);
      setUploadState("done");
      onUploaded(metadata);
    } catch (err) {
      const uploadErr = err as Error;
      const msg = `Gagal mengupload file: ${uploadErr.message}`;
      setErrorMessage(msg);
      setUploadState("error");
      onError?.(msg);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleReset = () => {
    setUploadedFile(null);
    setUploadState("idle");
    setErrorMessage("");
    setProgress("");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept || defaultAccept}
        capture={type === "foto" ? "environment" : undefined}
        className="hidden"
        onChange={handleFileSelected}
        disabled={uploadState === "uploading"}
      />

      {/* Upload area */}
      {uploadState === "done" && uploadedFile ? (
        // Tampilan setelah berhasil upload
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {type === "foto" ? (
                <FileImage className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              )}
              <span className="text-xs font-semibold text-emerald-800 truncate">
                {uploadedFile.name}
              </span>
              <Badge className="text-[9px] bg-emerald-100 text-emerald-700 border-emerald-300 shrink-0">
                {formatFileSize(uploadedFile.sizeBytes)}
              </Badge>
            </div>
            <a
              href={uploadedFile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-emerald-600 hover:underline truncate block mt-0.5"
            >
              Lihat File ↗
            </a>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="p-1 rounded-md hover:bg-emerald-100 text-emerald-700 transition-colors shrink-0"
            title="Hapus dan upload ulang"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : uploadState === "uploading" ? (
        // Tampilan saat mengupload
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-800">{progress}</p>
            <p className="text-[11px] text-blue-600">Harap tunggu, jangan tutup halaman ini.</p>
          </div>
        </div>
      ) : (
        // Tampilan idle / error
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={false}
          className={`w-full p-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center gap-2 text-sm group ${
            uploadState === "error"
              ? "border-red-300 bg-red-50 hover:bg-red-100"
              : "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400"
          }`}
        >
          {type === "foto" ? (
            <FileImage className={`w-8 h-8 ${uploadState === "error" ? "text-red-400" : "text-slate-400 group-hover:text-slate-600"}`} />
          ) : (
            <FileText className={`w-8 h-8 ${uploadState === "error" ? "text-red-400" : "text-slate-400 group-hover:text-slate-600"}`} />
          )}
          <div className="text-center">
            <p className={`font-semibold text-xs ${uploadState === "error" ? "text-red-700" : "text-slate-700"}`}>
              {label || (type === "foto" ? "Unggah Foto Kegiatan" : "Unggah Dokumen/PDF")}
            </p>
            <p className={`text-[11px] mt-0.5 ${uploadState === "error" ? "text-red-500" : "text-slate-400"}`}>
              Klik untuk memilih file dari perangkat • Maks. {maxSizeMB} MB
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] text-slate-500">
              {type === "foto" ? "JPG, PNG, WEBP" : "PDF, DOCX"}
            </span>
          </div>
        </button>
      )}

      {/* Error Message */}
      {uploadState === "error" && errorMessage && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 leading-relaxed">{errorMessage}</p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setUploadState("idle");
              setErrorMessage("");
            }}
            className="shrink-0 h-5 text-[10px] text-red-600 hover:bg-red-100 px-1"
          >
            Coba Lagi
          </Button>
        </div>
      )}
    </div>
  );
}
