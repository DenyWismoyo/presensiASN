"use server";

import { adminDb } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/firebase/session";
import { KantorUnit } from "@/types";
import { DEFAULT_KANTOR_LIST } from "@/data/masterKantor";

/**
 * Mengambil daftar seluruh kantor terdaftar dari Firestore.
 * Jika Firestore kosong (bukan error), fallback ke DEFAULT_KANTOR_LIST.
 */
export async function getKantorList(orgId?: string): Promise<KantorUnit[]> {
  let query = adminDb.collection("kantor").where("isActive", "==", true);
  if (orgId) {
    query = query.where("orgId", "==", orgId);
  }
  const snap = await query.get();

  if (!snap.empty) {
    return snap.docs.map((doc) => doc.data() as KantorUnit);
  }

  // Jika Firestore kosong (belum ada seed), fallback ke data default lokal
  // Ini BUKAN fallback error — Firestore kosong valid jika belum ada seed
  console.info("[Server Action Kantor] Koleksi kantor kosong, menggunakan DEFAULT_KANTOR_LIST.");
  return DEFAULT_KANTOR_LIST;
}

/**
 * Menyimpan atau memperbarui data titik kantor.
 * Hanya dapat diakses oleh role admin.
 */
export async function saveKantor(
  kantor: KantorUnit
): Promise<{ success: boolean; data?: KantorUnit; message?: string }> {
  // Validasi sesi — hanya admin
  await requireAuth(["admin"]);

  await adminDb.collection("kantor").doc(kantor.id).set(kantor, { merge: true });
  return { success: true, data: kantor, message: "Data kantor berhasil disimpan." };
}

/**
 * Menghapus atau menonaktifkan kantor.
 * Hanya dapat diakses oleh role admin.
 */
export async function deleteKantor(
  kantorId: string
): Promise<{ success: boolean; message?: string }> {
  // Validasi sesi — hanya admin
  await requireAuth(["admin"]);

  await adminDb.collection("kantor").doc(kantorId).delete();
  return { success: true, message: "Kantor berhasil dihapus." };
}
