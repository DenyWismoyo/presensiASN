import { adminAuth, isFirebaseAdminConfigured } from "./admin";

export interface PushNotificationPayload {
  userId: string; // Target UID user
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Mengirim Push Notification via FCM ke device target pengguna.
 * Memerlukan setup FCM device token di Firestore users atau real-time.
 * Untuk kesederhanaan, kita bisa menyimpan array `fcmTokens` di document users/{userId}.
 */
export async function sendPushNotification(payload: PushNotificationPayload) {
  if (!isFirebaseAdminConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[FCM-DEV] Notification to ${payload.userId}: ${payload.title} - ${payload.body}`);
    }
    return false;
  }

  try {
    const { getMessaging } = await import("firebase-admin/messaging");
    const adminDb = (await import("./admin")).adminDb;
    
    // Ambil token dari firestore user
    const userDoc = await adminDb.collection("users").doc(payload.userId).get();
    if (!userDoc.exists) return false;
    
    const userData = userDoc.data();
    const tokens: string[] = userData?.fcmTokens || [];
    
    if (tokens.length === 0) {
      console.log(`[FCM] User ${payload.userId} tidak memiliki FCM Token`);
      return false;
    }

    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      tokens: tokens,
    };

    const response = await getMessaging().sendEachForMulticast(message);
    
    // Bersihkan token yang tidak valid
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      
      if (failedTokens.length > 0) {
        // Hapus dari firestore
        const validTokens = tokens.filter(t => !failedTokens.includes(t));
        await adminDb.collection("users").doc(payload.userId).update({
          fcmTokens: validTokens
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error("[FCM] Gagal mengirim notifikasi:", error);
    return false;
  }
}
