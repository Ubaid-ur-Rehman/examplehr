"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { triggerAnniversary } from "@/api/hcm";
import { BalanceCard } from "@/components/BalanceCard/BalanceCard";
import { RequestForm } from "@/components/RequestForm/RequestForm";
import { RequestList } from "@/components/RequestList/RequestList";
import { useBalances } from "@/hooks/useBalances";
import { useRequests } from "@/hooks/useRequests";
import { useSubmitRequest } from "@/hooks/useSubmitRequest";
import { useAppStore } from "@/lib/store";

const currentUser = {
  employeeId: "emp-1",
  name: "Alice",
};

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

export default function EmployeePage() {
  const queryClient = useQueryClient();
  const addNotification = useAppStore((state) => state.addNotification);
  const balancesQuery = useBalances(currentUser.employeeId);
  const requestsQuery = useRequests(currentUser.employeeId);
  const submitRequestMutation = useSubmitRequest();
  const totalAvailableDays =
    balancesQuery.data?.balances.reduce((total, balance) => total + balance.available, 0) ?? 0;

  const anniversaryMutation = useMutation({
    mutationFn: () => triggerAnniversary(currentUser.employeeId, "loc-nyc"),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["balances"] }),
        queryClient.invalidateQueries({
          queryKey: ["balance", currentUser.employeeId, "loc-nyc"],
        }),
      ]);

      addNotification(
        createNotification(
          "info",
          "Anniversary bonus applied for Alice in New York.",
        ),
      );
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-600 via-indigo-600 to-blue-500 p-6 text-white shadow-lg shadow-indigo-200 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-100">
              Employee workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome back, {currentUser.name}
            </h1>
            <p className="mt-3 text-sm text-indigo-100 sm:text-base">
              You currently have <span className="font-semibold text-white">{totalAvailableDays} total available days</span> across all locations.
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={anniversaryMutation.isPending}
            type="button"
            onClick={() => anniversaryMutation.mutate()}
          >
            {anniversaryMutation.isPending
              ? "Applying bonus..."
              : "Trigger Anniversary Bonus"}
          </button>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Your Balances</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {balancesQuery.isLoading
            ? Array.from({ length: 2 }).map((_, index) => (
                <BalanceCard key={index} isLoading />
              ))
            : balancesQuery.data?.balances.map((balance) => (
                <BalanceCard key={balance.locationId} balance={balance} />
              ))}
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="mb-5">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Request Time Off</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Create a new request with date range, location, and reason.
          </p>
        </div>
        <RequestForm
          employeeId={currentUser.employeeId}
          balances={balancesQuery.data?.balances ?? []}
          isSubmitting={submitRequestMutation.isPending}
          submitError={
            submitRequestMutation.isError
              ? "Unable to submit request. Please review the form and try again."
              : null
          }
          onSubmit={(data) =>
            submitRequestMutation.mutate({
              employeeId: currentUser.employeeId,
              ...data,
            })
          }
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Your Requests</h2>
        <RequestList
          requests={requestsQuery.data ?? []}
          isLoading={requestsQuery.isLoading}
        />
      </section>
    </div>
  );
}
