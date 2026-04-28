import { formatDistanceToNow, format, parseISO } from "date-fns";

import type { Balance, TimeOffRequest } from "@/types";

interface ManagerRequestCardProps {
  request: TimeOffRequest;
  balance: Balance | undefined;
  isLoadingBalance?: boolean;
  isApproving?: boolean;
  isDenying?: boolean;
  onApprove: (requestId: string) => void;
  onDeny: (requestId: string) => void;
}

const LOCATION_NAMES: Record<string, string> = {
  "loc-nyc": "New York",
  "loc-sf": "San Francisco",
  "loc-chicago": "Chicago",
};

const EMPLOYEE_NAMES: Record<string, string> = {
  "emp-1": "Alice",
  "emp-2": "Bob",
};

function getLocationName(locationId: string) {
  if (LOCATION_NAMES[locationId]) {
    return LOCATION_NAMES[locationId];
  }

  return locationId
    .replace(/^loc-/, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getEmployeeLabel(employeeId: string) {
  const employeeName = EMPLOYEE_NAMES[employeeId] ?? "Employee";
  return `${employeeName} - ${employeeId}`;
}

function formatDateRange(startDate: string, endDate: string) {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
}

function getResolvedStatusBadge(status: TimeOffRequest["status"]) {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-700";
    case "denied":
      return "bg-red-100 text-red-700";
    case "cancelled":
      return "bg-zinc-200 text-zinc-700";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

function BalanceSkeleton() {
  return (
    <div
      aria-label="Loading balance context"
      className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-4"
    >
      <div className="space-y-3">
        <div className="h-4 w-36 rounded bg-zinc-200" />
        <div className="h-6 w-24 rounded bg-zinc-200" />
        <div className="h-4 w-48 rounded bg-zinc-200" />
      </div>
    </div>
  );
}

export function ManagerRequestCard({
  request,
  balance,
  isLoadingBalance = false,
  isApproving = false,
  isDenying = false,
  onApprove,
  onDeny,
}: ManagerRequestCardProps) {
  const isPending = request.status === "pending";
  const hasEnoughBalance = balance ? request.days <= balance.available : false;
  const actionsDisabled = isApproving || isDenying;

  return (
    <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {getEmployeeLabel(request.employeeId)}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-zinc-950">
            {getLocationName(request.locationId)}
          </h3>
          <p className="mt-2 text-sm text-zinc-600">
            {formatDateRange(request.startDate, request.endDate)} · {request.days} days
          </p>
        </div>

        {!isPending ? (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${getResolvedStatusBadge(
              request.status,
            )}`}
          >
            {request.status}
          </span>
        ) : null}
      </div>

      <div className="mt-5 rounded-2xl bg-zinc-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Reason
        </p>
        <p className="mt-2 text-sm leading-6 text-zinc-700">{request.reason}</p>
      </div>

      <div className="mt-5">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-900">Balance context</p>

        {isLoadingBalance ? <BalanceSkeleton /> : null}

        {!isLoadingBalance && !balance ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <p className="text-sm font-semibold">
              Balance unavailable - approve with caution
            </p>
          </div>
        ) : null}

        {!isLoadingBalance && balance ? (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Available balance
                </p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950">
                  {balance.available} days
                </p>
              </div>

              {balance.isFresh ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Stale - last synced{" "}
                  {formatDistanceToNow(new Date(balance.lastSyncedAt), {
                    addSuffix: false,
                  })}{" "}
                  ago
                </span>
              )}
            </div>

            <div className="mt-4 rounded-xl bg-white p-3 ring-1 ring-inset ring-zinc-100">
              <p className="text-sm text-zinc-700">
                {hasEnoughBalance
                  ? "Employee appears to have enough balance for this request."
                  : "Employee may not have enough balance"}
              </p>
            </div>

            {!hasEnoughBalance ? (
              <p className="mt-3 text-sm font-medium text-red-700">
                Employee may not have enough balance
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {isPending ? (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow disabled:cursor-not-allowed disabled:bg-emerald-300"
            disabled={actionsDisabled}
            type="button"
            onClick={() => onApprove(request.id)}
          >
            {isApproving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Approving...
              </>
            ) : (
              "Approve"
            )}
          </button>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-red-700 hover:shadow disabled:cursor-not-allowed disabled:bg-red-300"
            disabled={actionsDisabled}
            type="button"
            onClick={() => onDeny(request.id)}
          >
            {isDenying ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Denying...
              </>
            ) : (
              "Deny"
            )}
          </button>
        </div>
      ) : null}
    </article>
  );
}

export default ManagerRequestCard;
