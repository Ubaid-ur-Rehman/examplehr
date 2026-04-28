import { useMutation, useQueryClient } from "@tanstack/react-query";

import { approveRequest, HcmApiError } from "@/api/hcm";
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

export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveRequest,
    onSuccess: async () => {
      useAppStore
        .getState()
        .addNotification(createNotification("success", "Request approved."));

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["requests"] }),
        queryClient.invalidateQueries({ queryKey: ["balances"] }),
      ]);
    },
    onError: (error) => {
      if (error instanceof HcmApiError && error.code === "BALANCE_CHANGED") {
        useAppStore.getState().addNotification(
          createNotification(
            "warning",
            "Balance changed since request was submitted. Please review.",
          ),
        );
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["balance"] });
      await queryClient.invalidateQueries({ queryKey: ["balances"] });
    },
  });
}
