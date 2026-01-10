"use client";

import { useQuery } from "@tanstack/react-query";
import { getMonthlyTaskStats } from "@/actions";

export function useMonthlyTaskStats(month: string) {
  return useQuery({
    queryKey: ["monthlyTaskStats", month],
    queryFn: async () => {
      const result = await getMonthlyTaskStats({ month });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!month,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
