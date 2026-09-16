"use client";

import { useQuery } from "@tanstack/react-query";
import { getRekapStatistikAction, RekapStatistikData } from "@/actions/statistik";

export function useRekapStatistik(
  bulan?: number,
  tahun?: number,
  kantorId?: string
) {
  return useQuery<RekapStatistikData>({
    queryKey: ["rekap-statistik", bulan, tahun, kantorId],
    queryFn: async () => {
      return await getRekapStatistikAction({ bulan, tahun, kantorId });
    },
  });
}
