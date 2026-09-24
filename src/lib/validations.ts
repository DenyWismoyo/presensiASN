import { z } from "zod";

export const LoginSchema = z.object({
  identifier: z.string().min(3, "Identifier (NIP/Email) minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const CheckInSchema = z.object({
  userId: z.string().min(1, "User ID wajib ada"),
  nip: z.string().min(1, "NIP wajib ada"),
  nama: z.string().min(1, "Nama wajib ada"),
  orgId: z.string().min(1, "Org ID wajib ada"),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  shiftId: z.string().optional(),
  kantorId: z.string().optional(),
  namaKantor: z.string().optional(),
  jarakMeter: z.number().optional(),
  koordinat: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  fotoUrl: z.string().url("Format URL tidak valid"),
  isValidLocation: z.boolean(),
  alamat: z.string().optional(),
  catatan: z.string().optional(),
  gpsAccuracyMeter: z.number().optional(),
  isMockDetected: z.boolean().optional(),
});

export const CheckOutSchema = z.object({
  userId: z.string().min(1, "User ID wajib ada"),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  shiftId: z.string().optional(),
  kantorId: z.string().optional(),
  namaKantor: z.string().optional(),
  jarakMeter: z.number().optional(),
  koordinat: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  fotoUrl: z.string().url("Format URL tidak valid"),
  isValidLocation: z.boolean(),
  alamat: z.string().optional(),
  catatan: z.string().optional(),
  gpsAccuracyMeter: z.number().optional(),
  isMockDetected: z.boolean().optional(),
});

export const CreatePegawaiSchema = z.object({
  nip: z.string().min(9, "NIP harus berupa angka resmi ASN"),
  nama: z.string().min(3, "Nama lengkap pegawai wajib diisi minimal 3 karakter"),
  email: z.string().email("Alamat email tidak valid"),
  password: z.string().min(6, "Kata sandi awal minimal 6 karakter").optional(),
  role: z.enum(["admin", "atasan", "pegawai"]),
  jabatan: z.string().min(1, "Jabatan wajib diisi"),
  golongan: z.string().min(1, "Golongan wajib diisi"),
  instansi: z.string().optional(),
  orgId: z.string().optional(),
  departmentId: z.string().optional(),
  departmentName: z.string().optional(),
  kantorId: z.string().min(1, "Kantor wajib diisi"),
  namaKantor: z.string().min(1, "Nama Kantor wajib diisi"),
  atasanId: z.string().optional(),
  atasanNama: z.string().optional(),
  nomorHp: z.string().optional(),
});
