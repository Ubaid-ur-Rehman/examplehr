"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { triggerAnniversary } from "@/api/hcm";
import { ManagerRequestCard } from "@/components/ManagerRequestCard/ManagerRequestCard";
import { RequestList } from "@/components/RequestList/RequestList";
import { useApproveRequest } from "@/hooks/useApproveRequest";
import { useBalance } from "@/hooks/useBalance";
import { useDenyRequest } from "@/hooks/useDenyRequest";
import { useRequests } from "@/hooks/useRequests";
import { useAppStore } from "@/lib/store";
import type { TimeOffRequest } from "@/types";

const currentUser = {
  employeeId: "emp-2",
  name: "Bob (Manager)",
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

function PendingRequestCard({
  request,
  activeApproveId,
  activeDenyId,
  onApprove,
  onDeny,
}: {
  request: TimeOffRequest;
  activeApproveId?: string;
  activeDenyId?: string;
  onApprove: (requestId: string) => void;
  onDeny: (requestId: string) => void;
}) {
  const balanceQuery = useBalance(request.employeeId, request.locationId);

  return (
    <ManagerRequestCard
      request={request}
      balance={balanceQuery.data?.balance}
      isLoadingBalance={balanceQuery.isLoading}
      isApproving={activeApproveId === request.id}
      isDenying={activeDenyId === request.id}
      onApprove={onApprove}
      onDeny={onDeny}
    />
  );
}

export default function ManagerPage() {
  const queryClient = useQueryClient();
  const addNotification = useAppStore((state) => state.addNotification);
  const requestsQuery = useRequests();
  const approveMutation = useApproveRequest();
  const denyMutation = useDenyRequest();

  const anniversaryMutation = useMutation({
    mutationFn: () => triggerAnniversary("emp-1", "loc-nyc"),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["balances"] }),
        queryClient.invalidateQueries({ queryKey: ["balance"] }),
      ]);

      addNotification(
        createNotification(
          "info",
          "Anniversary bonus applied for Alice in New York.",
        ),
      );
    },
  });

  const allRequests = requestsQuery.data ?? [];
  const pendingRequests = allRequests.filter((request) => request.status === "pending");
  const resolvedRequests = allRequests.filter((request) =>
    request.status === "approved" || request.status === "denied",
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Manager dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              {currentUser.name}
            </h1>
            <p className="mt-3 text-sm text-zinc-600">
              <span className="font-semibold text-zinc-900">{pendingRequests.length}</span> pending request{pendingRequests.length === 1 ? "" : "s"} awaiting review.
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition-all duration-200 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={anniversaryMutation.isPending}
            type="button"
            onClick={() => anniversaryMutation.mutate()}
          >
            {anniversaryMutation.isPending
              ? "Applying bonus..."
              : "Trigger Anniversary Bonus for Alice"}
          </button>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">Pending Requests</h2>

        {requestsQuery.isLoading ? (
          <RequestList requests={[]} isLoading />
        ) : pendingRequests.length ? (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <PendingRequestCard
                key={request.id}
                activeApproveId={approveMutation.variables}
                activeDenyId={denyMutation.variables}
                request={request}
                onApprove={(requestId) => approveMutation.mutate(requestId)}
                onDeny={(requestId) => denyMutation.mutate(requestId)}
              />
            ))}
          </div>
        ) : (
          <RequestList requests={[]} />
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">Resolved Requests</h2>
        <RequestList requests={resolvedRequests} isLoading={requestsQuery.isLoading} />
      </section>
    </div>
  );
}
