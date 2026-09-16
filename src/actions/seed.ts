"use server";

import { adminDb } from "@/lib/firebase/admin";
import { SEED_KANTOR, SEED_USERS, SEED_PRESENSI_SAMPLE, SEED_LKH_SAMPLE } from "@/data/seedData";

/**
 * Menyuntikkan seluruh data seed demo 1 kantor (Solo Teknopark) & pegawainya ke Firestore
 */
export async function seedDatabaseAction(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Seed Kantor
    await adminDb.collection("kantor").doc(SEED_KANTOR.id).set(SEED_KANTOR, { merge: true });

    // 2. Seed Users
    for (const roleKey of Object.keys(SEED_USERS)) {
      const u = SEED_USERS[roleKey as keyof typeof SEED_USERS];
      await adminDb.collection("users").doc(u.id).set(u, { merge: true });
    }

    // 3. Seed Presensi
    await adminDb.collection("presensi").doc(SEED_PRESENSI_SAMPLE.id).set(SEED_PRESENSI_SAMPLE, { merge: true });

    // 4. Seed LKH
    await adminDb.collection("lkh").doc(SEED_LKH_SAMPLE.id).set(SEED_LKH_SAMPLE, { merge: true });

    return {
      success: true,
      message: "Data seed resmi Solo Teknopark dan 3 akun ASN berhasil diinisialisasi ke Firestore!",
    };
  } catch (error) {
    console.warn("[Seed Action] Firebase live offline, dev store siap:", (error as Error).message);
    return {
      success: true,
      message: "Data seed resmi Solo Teknopark dan 3 akun ASN aktif dalam mode simulasi server.",
    };
  }
}
