import { useQuery } from "@tanstack/react-query";

import { fetchRequests } from "@/api/hcm";

export function useRequests(employeeId?: string) {
  return useQuery({
    queryKey: ["requests", employeeId],
    queryFn: fetchRequests,
    staleTime: 10_000,
    refetchInterval: 30_000,
    select: (requests) =>
      employeeId
        ? requests.filter((request) => request.employeeId === employeeId)
        : requests,
  });
}
