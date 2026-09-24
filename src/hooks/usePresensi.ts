"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPresensiToday,
  recordCheckIn,
  recordCheckOut,
  getPresensiHistory,
  getKehadiranStatusHariIni,
} from "@/actions/presensi";
import { CheckInPayload, CheckOutPayload } from "@/types";

export function usePresensiHarian(userId?: string, tanggal?: string) {
  return useQuery({
    queryKey: ["presensi", userId, tanggal],
    queryFn: async () => {
      if (!userId || !tanggal) return null;
      return await getPresensiToday(userId, tanggal);
    },
    enabled: Boolean(userId && tanggal),
  });
}

export function useRiwayatPresensi(userId?: string, limitDays: number = 7) {
  return useQuery({
    queryKey: ["presensi-history", userId, limitDays],
    queryFn: async () => {
      if (!userId) return [];
      return await getPresensiHistory(userId, limitDays);
    },
    enabled: Boolean(userId),
  });
}

export function useKehadiranStatus(userId?: string, tanggal?: string) {
  return useQuery({
    queryKey: ["kehadiran-status", userId, tanggal],
    queryFn: async () => {
      if (!userId || !tanggal) return null;
      return await getKehadiranStatusHariIni(userId, tanggal);
    },
    enabled: Boolean(userId && tanggal),
    // Status kehadiran bisa berubah cepat (misal disetujui atasan), refetch on window focus
    refetchOnWindowFocus: true,
  });
}

export function useCheckInMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CheckInPayload) => {
      return await recordCheckIn(payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["presensi", variables.userId, variables.tanggal],
      });
      queryClient.invalidateQueries({
        queryKey: ["presensi-history", variables.userId],
      });
    },
  });
}

export function useCheckOutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CheckOutPayload) => {
      return await recordCheckOut(payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["presensi", variables.userId, variables.tanggal],
      });
      queryClient.invalidateQueries({
        queryKey: ["presensi-history", variables.userId],
      });
    },
  });
}
