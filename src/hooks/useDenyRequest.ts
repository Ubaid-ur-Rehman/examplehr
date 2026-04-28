import { useMutation, useQueryClient } from "@tanstack/react-query";

import { denyRequest } from "@/api/hcm";
import { useAppStore } from "@/lib/store";

function createNotification(
  type: "success" | "error" | "warning" | "info",
  message: string,
) {
  return {
    id: crypto.randomUUID(),
    type,
    message,
    createdAt: new Date(),
  };
}

export function useDenyRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: denyRequest,
    onSuccess: async () => {
      useAppStore
        .getState()
        .addNotification(createNotification("success", "Request denied."));

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["requests"] }),
        queryClient.invalidateQueries({ queryKey: ["balances"] }),
      ]);
    },
  });
}
