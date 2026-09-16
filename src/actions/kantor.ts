"use server";

import { adminDb } from "@/lib/firebase/admin";
import { KantorUnit } from "@/types";
import { DEFAULT_KANTOR_LIST } from "@/data/masterKantor";

// In-memory store fallback untuk kantor
const devKantorStore = new Map<string, KantorUnit>();

// Inisialisasi default ke store
DEFAULT_KANTOR_LIST.forEach((k) => devKantorStore.set(k.id, k));

/**
 * Mengambil daftar seluruh kantor terdaftar
 */
export async function getKantorList(orgId?: string): Promise<KantorUnit[]> {
  try {
    let query = adminDb.collection("kantor").where("isActive", "==", true);
    if (orgId) {
      query = query.where("orgId", "==", orgId);
    }
    const snap = await query.get();
    if (!snap.empty) {
      return snap.docs.map((doc) => doc.data() as KantorUnit);
    }
  } catch (error) {
    console.warn("[Server Action Kantor] Ambil live offline, gunakan master default:", (error as Error).message);
  }

  const results: KantorUnit[] = [];
  devKantorStore.forEach((k) => {
    if (!orgId || k.orgId === orgId) {
      results.push(k);
    }
  });

  return results.length > 0 ? results : DEFAULT_KANTOR_LIST;
}

/**
 * Menyimpan atau memperbarui data titik kantor
 */
export async function saveKantor(
  kantor: KantorUnit
): Promise<{ success: boolean; data?: KantorUnit; message?: string }> {
  try {
    await adminDb.collection("kantor").doc(kantor.id).set(kantor, { merge: true });
    devKantorStore.set(kantor.id, kantor);
    return { success: true, data: kantor, message: "Data kantor berhasil disimpan." };
  } catch (error) {
    console.warn("[Server Action Kantor] Simpan live offline, simpan ke dev store:", (error as Error).message);
    devKantorStore.set(kantor.id, kantor);
    return {
      success: true,
      data: kantor,
      message: "Data kantor tersimpan (Mode Simulasi Dev)",
    };
  }
}

/**
 * Menghapus atau menonaktifkan kantor
 */
export async function deleteKantor(
  kantorId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    await adminDb.collection("kantor").doc(kantorId).delete();
    devKantorStore.delete(kantorId);
    return { success: true, message: "Kantor berhasil dihapus." };
  } catch (error) {
    console.warn("[Server Action Kantor] Hapus live offline, hapus dari dev store:", (error as Error).message);
    devKantorStore.delete(kantorId);
    return { success: true, message: "Kantor dihapus (Mode Dev)" };
  }
}
