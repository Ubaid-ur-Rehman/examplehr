import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  fetchBalance,
  HcmApiError,
  submitRequest,
} from "@/api/hcm";
import { useAppStore } from "@/lib/store";
import type {
  Balance,
  HCMBatchResponse,
  HCMSingleBalanceResponse,
  TimeOffRequest,
} from "@/types";

type SubmitRequestInput = Pick<
  TimeOffRequest,
  "employeeId" | "locationId" | "days" | "startDate" | "endDate" | "reason"
>;

interface MutationContext {
  previousBalances?: HCMBatchResponse;
  previousBalance?: HCMSingleBalanceResponse;
  requestId: string;
  employeeId: string;
  locationId: string;
  days: number;
}

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

function applyOptimisticBalance(balance: Balance, days: number): Balance {
  return {
    ...balance,
    available: balance.available - days,
    pending: balance.pending + days,
    lastSyncedAt: new Date(),
    isFresh: true,
  };
}

export function useSubmitRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitRequest,
    onMutate: async (variables) => {
      const requestId = crypto.randomUUID();
      const store = useAppStore.getState();

      store.addPendingRequest(requestId);

      await queryClient.cancelQueries({ queryKey: ["balances"] });
      await queryClient.cancelQueries({
        queryKey: ["balance", variables.employeeId, variables.locationId],
      });

      const previousBalances = queryClient.getQueryData<HCMBatchResponse>([
        "balances",
      ]);
      const previousBalance = queryClient.getQueryData<HCMSingleBalanceResponse>([
        "balance",
        variables.employeeId,
        variables.locationId,
      ]);

      if (previousBalances) {
        queryClient.setQueryData<HCMBatchResponse>(["balances"], {
          ...previousBalances,
          balances: previousBalances.balances.map((balance) =>
            balance.employeeId === variables.employeeId &&
            balance.locationId === variables.locationId
              ? applyOptimisticBalance(balance, variables.days)
              : balance,
          ),
        });
      }

      if (previousBalance) {
        queryClient.setQueryData<HCMSingleBalanceResponse>(
          ["balance", variables.employeeId, variables.locationId],
          {
            ...previousBalance,
            balance: applyOptimisticBalance(previousBalance.balance, variables.days),
          },
        );
      }

      return {
        previousBalances,
        previousBalance,
        requestId,
        employeeId: variables.employeeId,
        locationId: variables.locationId,
        days: variables.days,
      } satisfies MutationContext;
    },
    onSuccess: async (_data, variables, context) => {
      const store = useAppStore.getState();
      const verifiedBalance = await fetchBalance(
        variables.employeeId,
        variables.locationId,
      );
      const previousAvailable = context?.previousBalance?.balance.available;
      const previousPending = context?.previousBalance?.balance.pending;
      const isSilentFailure =
        previousAvailable !== undefined &&
        previousPending !== undefined &&
        verifiedBalance.balance.available === previousAvailable &&
        verifiedBalance.balance.pending === previousPending;

      if (isSilentFailure && context) {
        if (context.previousBalances) {
          queryClient.setQueryData(["balances"], context.previousBalances);
        }

        if (context.previousBalance) {
          queryClient.setQueryData(
            ["balance", context.employeeId, context.locationId],
            context.previousBalance,
          );
        }

        store.removePendingRequest(context.requestId);
        store.addRolledBackRequest(context.requestId);
        store.addNotification(
          createNotification(
            "warning",
            "Request may not have been saved. Please try again.",
          ),
        );

        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["balances"] }),
        queryClient.invalidateQueries({ queryKey: ["balance"] }),
        queryClient.invalidateQueries({ queryKey: ["requests"] }),
      ]);

      if (context) {
        store.removePendingRequest(context.requestId);
      }

      store.addNotification(
        createNotification("success", "Request submitted successfully."),
      );
    },
    onError: (error, _variables, context) => {
      const store = useAppStore.getState();

      if (context?.previousBalances) {
        queryClient.setQueryData(["balances"], context.previousBalances);
      }

      if (context?.previousBalance) {
        queryClient.setQueryData(
          ["balance", context.employeeId, context.locationId],
          context.previousBalance,
        );
      }

      if (context) {
        store.removePendingRequest(context.requestId);
        store.addRolledBackRequest(context.requestId);
      }

      if (error instanceof HcmApiError && error.code === "INSUFFICIENT_BALANCE") {
        store.addNotification(
          createNotification(
            "error",
            `Insufficient balance. You have ${error.available ?? 0} days available.`,
          ),
        );
        return;
      }

      if (error instanceof HcmApiError && error.code === "INVALID_DIMENSION") {
        store.addNotification(
          createNotification(
            "error",
            "Invalid request. Please check your location.",
          ),
        );
        return;
      }

      store.addNotification(
        createNotification("error", "Something went wrong. Please try again."),
      );
    },
  });
}
