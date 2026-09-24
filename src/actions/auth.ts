"use server";

import { adminDb } from "@/lib/firebase/admin";

export async function lookupEmailByAccessCode(accessCode: string): Promise<string | null> {
  try {
    const snapshot = await adminDb
      .collection("users")
      .where("accessCode", "==", accessCode)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      return data.email || null;
    }

    return null;
  } catch (error) {
    console.error("Error looking up email by access code:", error);
    return null;
  }
}
