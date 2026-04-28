import { useQuery } from "@tanstack/react-query";

import { fetchBalance } from "@/api/hcm";

const FRESHNESS_WINDOW_MS = 30_000;

export function useBalance(employeeId?: string, locationId?: string) {
  return useQuery({
    queryKey: ["balance", employeeId, locationId],
    queryFn: () => fetchBalance(employeeId!, locationId!),
    enabled: Boolean(employeeId && locationId),
    staleTime: 30_000,
    refetchInterval: 60_000,
    select: (data) => {
      const lastSyncedAt = new Date(data.balance.lastSyncedAt);
      const isFresh = Date.now() - lastSyncedAt.getTime() < FRESHNESS_WINDOW_MS;

      return {
        ...data,
        balance: {
          ...data.balance,
          lastSyncedAt,
          isFresh,
        },
      };
    },
  });
}
