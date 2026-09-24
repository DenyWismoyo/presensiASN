"use server";

import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/firebase/session";

export interface AuditLogPayload {
  action: "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" | "LOGIN";
  entityType: "PRESENSI" | "LKH" | "LEMBUR" | "IZIN" | "PEGAWAI" | "KANTOR" | "ORGANIZATION" | "AUTH";
  entityId: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Mencatat log aktivitas ke koleksi auditLogs secara append-only.
 * Digunakan untuk compliance dan penelusuran mutasi data.
 */
export async function recordAuditLog(payload: AuditLogPayload) {
  // Dalam kasus login, kita mungkin belum punya session yang utuh
  // namun untuk kebanyakan action, kita bisa ambil dari session.
  let actorId = "system";
  let actorName = "System";
  let actorRole = "system";
  let orgId = "system";

  try {
    const sessionUser = await requireAuth();
    actorId = sessionUser.id;
    actorName = sessionUser.nama;
    actorRole = sessionUser.role;
    orgId = sessionUser.orgId;
  } catch (err) {
    // Abaikan jika tidak ada session aktif (misal dari login hook)
  }

  const now = new Date().toISOString();
  const logEntry = {
    ...payload,
    actorId,
    actorName,
    actorRole,
    orgId,
    timestamp: now,
  };

  if (isFirebaseAdminConfigured()) {
    try {
      await adminDb.collection("auditLogs").add(logEntry);
    } catch (error) {
      console.warn("[Audit Log] Gagal menyimpan log Firestore:", error);
    }
  }
  
  if (process.env.NODE_ENV === "development") {
    const globalAny = global as any;
    globalAny.devAuditLogs = globalAny.devAuditLogs || [];
    globalAny.devAuditLogs.push(logEntry);
    console.log(`[AUDIT] ${logEntry.action} pada ${logEntry.entityType} oleh ${actorName}`);
  }
}
