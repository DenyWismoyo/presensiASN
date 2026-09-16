"use server";

import { adminDb } from "@/lib/firebase/admin";

export interface PengajuanIzinItem {
  id: string;
  userId: string;
  nama: string;
  nip: string;
  jenis: "Cuti Tahunan" | "Izin Alasan Penting" | "Sakit" | "Dinas Luar";
  tanggalMulai: string;
  tanggalSelesai: string;
  jumlahHari: number;
  alasan: string;
  dokumenUrl?: string;
  dokumenNama?: string;
  status: "menunggu" | "disetujui" | "ditolak";
  createdAt: string;
}

// In-memory fallback untuk mode dev offline
const devIzinStore = new Map<string, PengajuanIzinItem>();

export async function getIzinList(userId?: string): Promise<PengajuanIzinItem[]> {
  try {
    let query = adminDb.collection("izin").orderBy("createdAt", "desc");
    if (userId) {
      query = query.where("userId", "==", userId);
    }
    const snap = await query.get();
    if (!snap.empty) {
      return snap.docs.map((doc) => doc.data() as PengajuanIzinItem);
    }
  } catch (error) {
    console.warn("[Server Action Izin] Firebase offline, cek dev store:", (error as Error).message);
  }

  const results: PengajuanIzinItem[] = [];
  devIzinStore.forEach((item) => {
    if (!userId || item.userId === userId) {
      results.push(item);
    }
  });

  return results;
}

export async function submitIzin(
  data: Omit<PengajuanIzinItem, "id" | "createdAt" | "status">
): Promise<{ success: boolean; data?: PengajuanIzinItem; message?: string }> {
  const id = `izin-${Date.now()}`;
  const record: PengajuanIzinItem = {
    ...data,
    id,
    status: "menunggu",
    createdAt: new Date().toISOString(),
  };

  try {
    await adminDb.collection("izin").doc(id).set(record);
    devIzinStore.set(id, record);
    return { success: true, data: record, message: "Pengajuan izin berhasil diajukan." };
  } catch (error) {
    console.warn("[Server Action Izin] Simpan offline dev store:", (error as Error).message);
    devIzinStore.set(id, record);
    return { success: true, data: record, message: "Pengajuan izin tersimpan (Mode Dev)." };
  }
}
