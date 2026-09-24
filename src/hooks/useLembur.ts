import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLemburByDate,
  getLemburHistory,
  getPendingLemburList,
  pengajuanLembur,
  approveLembur,
  rejectLembur,
  checkInLembur,
  checkOutLembur,
} from "@/actions/lembur";
import { PengajuanLemburPayload, CheckInLemburPayload, CheckOutLemburPayload } from "@/types";

// ──────────────────────────────────────────────────────────────────
// READ Hooks
// ──────────────────────────────────────────────────────────────────

/**
 * Mengambil record lembur untuk tanggal tertentu.
 * queryKey: ['lembur-harian', userId, tanggal]
 */
export function useLemburHarian(userId?: string, tanggal?: string) {
  return useQuery({
    queryKey: ["lembur-harian", userId, tanggal],
    queryFn: () => getLemburByDate(userId!, tanggal!),
    enabled: !!userId && !!tanggal,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Mengambil riwayat lembur pegawai (30 hari terakhir).
 * queryKey: ['lembur-histori', userId]
 */
export function useLemburHistory(userId?: string, limitDays = 30) {
  return useQuery({
    queryKey: ["lembur-histori", userId, limitDays],
    queryFn: () => getLemburHistory(userId!, limitDays),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Mengambil daftar lembur pending untuk approval atasan.
 * queryKey: ['lembur-pending', orgId]
 */
export function usePendingLemburList(orgId?: string) {
  return useQuery({
    queryKey: ["lembur-pending", orgId],
    queryFn: () => getPendingLemburList(orgId),
    enabled: true,
    staleTime: 1000 * 30,
  });
}

// ──────────────────────────────────────────────────────────────────
// WRITE Mutations
// ──────────────────────────────────────────────────────────────────

/**
 * Mutation: Pengajuan lembur baru oleh pegawai.
 */
export function usePengajuanLemburMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PengajuanLemburPayload) => pengajuanLembur(payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["lembur-harian", variables.userId] });
      qc.invalidateQueries({ queryKey: ["lembur-histori", variables.userId] });
    },
  });
}

/**
 * Mutation: Approve lembur bawahan oleh atasan.
 */
export function useApproveLemburMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      lemburId,
      atasanId,
      atasanNama,
      catatanAtasan,
    }: {
      lemburId: string;
      atasanId: string;
      atasanNama: string;
      catatanAtasan?: string;
    }) => approveLembur(lemburId, atasanId, atasanNama, catatanAtasan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lembur-pending"] });
    },
  });
}

/**
 * Mutation: Reject lembur bawahan oleh atasan.
 */
export function useRejectLemburMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      lemburId,
      atasanId,
      atasanNama,
      alasanPenolakan,
    }: {
      lemburId: string;
      atasanId: string;
      atasanNama: string;
      alasanPenolakan: string;
    }) => rejectLembur(lemburId, atasanId, atasanNama, alasanPenolakan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lembur-pending"] });
    },
  });
}

/**
 * Mutation: Check-in lembur pegawai (geofence + foto).
 */
export function useCheckInLemburMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CheckInLemburPayload) => checkInLembur(payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["lembur-harian", variables.userId] });
      qc.invalidateQueries({ queryKey: ["lembur-histori", variables.userId] });
    },
  });
}

/**
 * Mutation: Check-out lembur pegawai.
 */
export function useCheckOutLemburMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CheckOutLemburPayload) => checkOutLembur(payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["lembur-harian", variables.userId] });
      qc.invalidateQueries({ queryKey: ["lembur-histori", variables.userId] });
    },
  });
}
