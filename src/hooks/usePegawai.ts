"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPegawaiList,
  createPegawaiAction,
  updatePegawaiAction,
  deletePegawaiAction,
  CreatePegawaiPayload,
  PegawaiFilter,
} from "@/actions/pegawai";
import { UserProfile } from "@/types";

export function usePegawaiList(filters?: PegawaiFilter) {
  return useQuery({
    queryKey: ["pegawai-list", filters?.kantorId, filters?.role, filters?.search],
    queryFn: async () => {
      return await getPegawaiList(filters);
    },
  });
}

export function useCreatePegawaiMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatePegawaiPayload) => {
      return await createPegawaiAction(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pegawai-list"] });
    },
  });
}

export function useUpdatePegawaiMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      payload,
    }: {
      userId: string;
      payload: Partial<UserProfile>;
    }) => {
      return await updatePegawaiAction(userId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pegawai-list"] });
    },
  });
}

export function useDeletePegawaiMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      return await deletePegawaiAction(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pegawai-list"] });
    },
  });
}
