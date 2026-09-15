"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLKHByDate, saveLKH, submitLKH, SaveLKHPayload } from "@/actions/lkh";

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
    },
  });
}
