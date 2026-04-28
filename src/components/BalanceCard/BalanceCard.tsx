import { formatDistanceToNow } from "date-fns";

import type { Balance } from "@/types";

type BalanceCardOptimisticStatus =
  | "submitting"
  | "pending-confirm"
  | "rolled-back";

type BalanceCardBalance = Balance & {
  optimisticStatus?: BalanceCardOptimisticStatus;
  originalAvailable?: number;
};

interface BalanceCardProps {
  balance?: BalanceCardBalance;
  isLoading?: boolean;
  error?: boolean;
  highlightRefresh?: boolean
  silentFailure?: boolean
}

const LOCATION_NAMES: Record<string, string> = {
  "loc-nyc": "New York",
  "loc-sf": "San Francisco",
  "loc-chicago": "Chicago",
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

function getSyncedLabel(lastSyncedAt: Date) {
  return `Synced ${formatDistanceToNow(lastSyncedAt, { addSuffix: false })} ago`;
}

function FreshnessIndicator({
  isFresh,
  optimisticStatus,
}: {
  isFresh: boolean;
  optimisticStatus?: BalanceCardOptimisticStatus;
}) {
  if (optimisticStatus === "submitting" || optimisticStatus === "pending-confirm") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
        Pending
      </span>
    );
  }

  if (optimisticStatus === "rolled-back") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
        Failed
      </span>
    );
  }

  if (isFresh) {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
        <span
          aria-label="Fresh balance"
          className="h-2.5 w-2.5 rounded-full bg-emerald-500"
        />
        Fresh
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
      <span className="h-2 w-2 rounded-full bg-amber-500" />
      Balance may be outdated
    </span>
  );
}

export function BalanceCard({
  balance,
  isLoading = false,
  error = false,
  highlightRefresh,
   silentFailure
}: BalanceCardProps) {
  if (isLoading) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading balance"
        className="w-full rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-28 rounded bg-zinc-200" />
          <div className="h-10 w-24 rounded bg-zinc-200" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 rounded-xl bg-zinc-100" />
            <div className="h-16 rounded-xl bg-zinc-100" />
          </div>
          <div className="h-4 w-40 rounded bg-zinc-200" />
        </div>
      </div>
    );
  }

  if (error || !balance) {
    return (
      <div className="w-full rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
        <p className="text-sm font-semibold">Unable to load balance</p>
        <p className="mt-1 text-sm text-red-600">
          Please refresh and try again.
        </p>
      </div>
    );
  }

  const locationName = getLocationName(balance.locationId);
  const displayedAvailable =
    balance.optimisticStatus === "rolled-back" && balance.originalAvailable !== undefined
      ? balance.originalAvailable
      : balance.available;
  const isStale = !balance.isFresh;

  return (
    <div className="w-full rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
       {highlightRefresh && (
      <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
        ↻ Balance updated by HCM
      </div>
    )}
    {silentFailure && (
      <div className="mb-3 rounded-xl border border-yellow-100 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
        ⚠ Request may not have saved — please verify with HR
      </div>
    )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {locationName}
          </p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-5xl font-semibold leading-none tracking-tight text-zinc-950">
              {displayedAvailable}
            </span>
            <span className="pb-1 text-sm font-medium text-zinc-500">days</span>
          </div>
        </div>
        <FreshnessIndicator
          isFresh={!isStale}
          optimisticStatus={balance.optimisticStatus}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-y border-zinc-100 py-5">
        <div className="rounded-2xl bg-zinc-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Available
          </p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">
            {displayedAvailable} days
          </p>
        </div>
        <div className="rounded-2xl bg-zinc-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Pending
          </p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">
            {balance.pending} days
          </p>
        </div>
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-3 pt-4">
        <p className="text-sm text-zinc-500">
          {getSyncedLabel(new Date(balance.lastSyncedAt))}
        </p>
        {isStale ? (
          <p className="text-sm font-medium text-amber-700">
            Balance may be outdated
          </p>
        ) : (
          <p className="text-sm text-zinc-500">Using recent balance data</p>
        )}
      </div>
    </div>
  );
}

export default BalanceCard;
