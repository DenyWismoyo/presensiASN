"use server";

import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/firebase/session";
import {
  SEED_KANTOR,
  SEED_USERS,
  SEED_PRESENSI_SAMPLE,
  SEED_LKH_SAMPLE,
  getDevPresensiStore,
  getDevLKHStore,
  generateSeedPresensiHistory,
  SEED_PENDING_LKH_LIST,
} from "@/data/seedData";

/**
 * Menyuntikkan seluruh data inisialisasi resmi kantor Solo Teknopark & pegawainya ke Firestore / Dev Store.
 * Hanya dapat dijalankan oleh pengguna dengan role 'admin'.
 */
export async function seedDatabaseAction(): Promise<{ success: boolean; message: string }> {
  try {
    // Validasi izin: hanya Admin yang berhak melakukan inisialisasi data master
    await requireAuth(["admin"]);

    if (isFirebaseAdminConfigured()) {
      // 1. Inisialisasi Master Kantor
      await adminDb.collection("kantor").doc(SEED_KANTOR.id).set(SEED_KANTOR, { merge: true });

      // 2. Inisialisasi Profil Akun ASN
      for (const roleKey of Object.keys(SEED_USERS)) {
        const u = SEED_USERS[roleKey as keyof typeof SEED_USERS];
        await adminDb.collection("users").doc(u.id).set(u, { merge: true });
      }

      // 3. Inisialisasi Sampel Presensi
      await adminDb.collection("presensi").doc(SEED_PRESENSI_SAMPLE.id).set(SEED_PRESENSI_SAMPLE, { merge: true });

      // 4. Inisialisasi Sampel LKH
      await adminDb.collection("lkh").doc(SEED_LKH_SAMPLE.id).set(SEED_LKH_SAMPLE, { merge: true });

      return {
        success: true,
        message: "Data master kantor Solo Teknopark dan profil ASN berhasil disinkronkan ke Firestore.",
      };
    }

    if (process.env.NODE_ENV === "development") {
      // Inisialisasi dev in-memory store dengan data realistis
      const pStore = getDevPresensiStore();
      pStore.clear();
      const pHistory = generateSeedPresensiHistory();
      pHistory.forEach((p) => pStore.set(p.id, p));

      const lStore = getDevLKHStore();
      lStore.clear();
      SEED_PENDING_LKH_LIST.forEach((l) => lStore.set(l.id, l));

      return {
        success: true,
        message: "Mode Development: Data master kantor Solo Teknopark, profil ASN, 30 hari presensi, dan LKH tim berhasil diinisialisasi!",
      };
    }

    return {
      success: false,
      message: "Kredensial Firebase Admin belum terpasang di environment production.",
    };
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui.";
    console.error("[Seed Action Error]:", errMessage);
    return {
      success: false,
      message: `Gagal inisialisasi data: ${errMessage}`,
    };
  }
}
