"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getKantorList, saveKantor, deleteKantor } from "@/actions/kantor";
import { KantorUnit } from "@/types";

export function useKantorList(orgId?: string) {
  return useQuery({
    queryKey: ["kantor-list", orgId || "all"],
    queryFn: async () => {
      return await getKantorList(orgId);
    },
  });
}

export function useSaveKantorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (kantor: KantorUnit) => {
      return await saveKantor(kantor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kantor-list"] });
    },
  });
}

export function useDeleteKantorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (kantorId: string) => {
      return await deleteKantor(kantorId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kantor-list"] });
    },
  });
}
