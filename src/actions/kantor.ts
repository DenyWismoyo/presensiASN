"use server";

import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/firebase/session";
import { KantorUnit } from "@/types";
import { DEFAULT_KANTOR_LIST } from "@/data/masterKantor";

const globalAny = global as any;
const devKantorStore: Map<string, KantorUnit> = globalAny.devKantorStore || new Map(DEFAULT_KANTOR_LIST.map((k: KantorUnit) => [k.id, k]));
if (process.env.NODE_ENV !== "production") {
  globalAny.devKantorStore = devKantorStore;
}

/**
 * Mengambil daftar seluruh kantor terdaftar dari Firestore.
 * Jika Firestore kosong (bukan error), fallback ke DEFAULT_KANTOR_LIST.
 */
export async function getKantorList(orgId?: string): Promise<KantorUnit[]> {
  const sessionUser = await requireAuth();
  const targetOrgId = orgId || sessionUser.orgId;

  try {
    let query = adminDb.collection("kantor").where("isActive", "==", true);
    query = query.where("orgId", "==", targetOrgId);
    const snap = await query.get();

    if (!snap.empty) {
      return snap.docs.map((doc) => {
        const d = doc.data() as any;
        const lat =
          d.koordinat?.lat ??
          d.koordinat?.latitude ??
          d.koordinat?._latitude ??
          d.lat ??
          d.latitude ??
          -7.558392;
        const lng =
          d.koordinat?.lng ??
          d.koordinat?.longitude ??
          d.koordinat?._longitude ??
          d.lng ??
          d.longitude ??
          110.857528;

        return {
          id: doc.id,
          kodeKantor: d.kodeKantor || "KTR",
          namaKantor: d.namaKantor || "Kantor ASN",
          kategori: d.kategori || "OPD / Dinas",
          alamat: d.alamat || "",
          koordinat: {
            lat: typeof lat === "number" ? lat : parseFloat(lat) || -7.558392,
            lng: typeof lng === "number" ? lng : parseFloat(lng) || 110.857528,
          },
          radiusMeter: typeof d.radiusMeter === "number" ? d.radiusMeter : 150,
          jamMasukMaksimal: d.jamMasukMaksimal || "07:30",
          jamPulangMinimal: d.jamPulangMinimal || "16:00",
          orgId: d.orgId || "org-surakarta",
          isActive: d.isActive !== false,
        } as KantorUnit;
      });
    }

    // Jika Firestore kosong, kembalikan array kosong (tanpa mock)
    console.info("[Server Action Kantor] Koleksi kantor kosong di Firestore.");
    return [];
  } catch (error) {
    console.warn("[Server Action Kantor] Gagal mengambil kantor dari Firestore:", error);
    if (process.env.NODE_ENV === "development") {
      return Array.from(devKantorStore.values()).filter((k) => k.orgId === targetOrgId);
    }
    return [];
  }
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

  if (isFirebaseAdminConfigured()) {
    try {
      await adminDb.collection("kantor").doc(kantor.id).set(kantor, { merge: true });
    } catch (err) {
      console.warn("[Kantor] Gagal menyimpan ke Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    devKantorStore.set(kantor.id, kantor);
  }

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

  if (isFirebaseAdminConfigured()) {
    try {
      await adminDb.collection("kantor").doc(kantorId).delete();
    } catch (err) {
      console.warn("[Kantor] Gagal menghapus dari Firestore:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    devKantorStore.delete(kantorId);
  }

  return { success: true, message: "Kantor berhasil dihapus." };
}
