"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLKHByDate,
  saveLKH,
  submitLKH,
  getPendingLKHList,
  approveLKH,
  rejectLKH,
  SaveLKHPayload,
} from "@/actions/lkh";

export function useLKHHarian(userId?: string, tanggal?: string) {
  return useQuery({
    queryKey: ["lkh", userId, tanggal],
    queryFn: async () => {
      if (!userId || !tanggal) return null;
      return await getLKHByDate(userId, tanggal);
    },
    enabled: Boolean(userId && tanggal),
  });
}

export function usePendingLKHList(orgId?: string) {
  return useQuery({
    queryKey: ["pending-lkh", orgId],
    queryFn: async () => {
      return await getPendingLKHList(orgId);
    },
  });
}

export function useSaveLKHMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SaveLKHPayload) => {
      return await saveLKH(payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lkh", variables.userId, variables.tanggal],
      });
      queryClient.invalidateQueries({
        queryKey: ["pending-lkh"],
      });
    },
  });
}

export function useSubmitLKHMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, tanggal }: { userId: string; tanggal: string }) => {
      return await submitLKH(userId, tanggal);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lkh", variables.userId, variables.tanggal],
      });
      queryClient.invalidateQueries({
        queryKey: ["pending-lkh"],
      });
    },
  });
}

export function useApproveLKHMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lkhId,
      atasanId,
      atasanNama,
      catatanAtasan,
    }: {
      lkhId: string;
      atasanId: string;
      atasanNama: string;
      catatanAtasan?: string;
    }) => {
      return await approveLKH(lkhId, atasanId, atasanNama, catatanAtasan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pending-lkh"],
      });
      queryClient.invalidateQueries({
        queryKey: ["lkh"],
      });
    },
  });
}

export function useRejectLKHMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lkhId,
      atasanId,
      atasanNama,
      rejectedReason,
    }: {
      lkhId: string;
      atasanId: string;
      atasanNama: string;
      rejectedReason: string;
    }) => {
      return await rejectLKH(lkhId, atasanId, atasanNama, rejectedReason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pending-lkh"],
      });
      queryClient.invalidateQueries({
        queryKey: ["lkh"],
      });
    },
  });
}
