import { useQuery } from "@tanstack/react-query";

import { fetchAllBalances } from "@/api/hcm";

export function useBalances(employeeId?: string) {
  return useQuery({
    queryKey: ["balances"],
    queryFn: fetchAllBalances,
    staleTime: 30_000,
    refetchInterval: 60_000, 
    refetchOnWindowFocus: true,
    select: (data) => ({
      ...data,
      balances: employeeId
        ? data.balances.filter((balance) => balance.employeeId === employeeId)
        : data.balances,
    }),
  });
}
