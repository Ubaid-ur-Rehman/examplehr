import { format, parseISO } from "date-fns";

import type { TimeOffRequest } from "@/types";

interface RequestListProps {
  requests: TimeOffRequest[];
  isLoading?: boolean;
  onCancel?: (requestId: string) => void;
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

function formatDateRange(startDate: string, endDate: string) {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
}

function formatResolvedDate(resolvedAt?: Date) {
  if (!resolvedAt) {
    return null;
  }

  return format(new Date(resolvedAt), "MMM d, yyyy");
}

function getStatusPresentation(request: TimeOffRequest) {
  if (request.optimisticStatus === "submitting") {
    return {
      label: "Submitting...",
      className: "bg-blue-100 text-blue-700",
    };
  }

  if (request.optimisticStatus === "pending-confirm") {
    return {
      label: "Confirming...",
      className: "bg-blue-100 text-blue-700",
    };
  }

  if (request.optimisticStatus === "rolled-back") {
    return {
      label: "Failed - Rolled Back",
      className: "bg-red-100 text-red-700",
    };
  }

  switch (request.status) {
    case "approved":
      return {
        label: "Approved",
        className: "bg-emerald-100 text-emerald-700",
      };
    case "denied":
      return {
        label: "Denied",
        className: "bg-red-100 text-red-700",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        className: "bg-zinc-200 text-zinc-700",
      };
    case "pending":
    default:
      return {
        label: "Pending Approval",
        className: "bg-amber-100 text-amber-800",
      };
  }
}

function LoadingRows() {
  return (
    <div className="space-y-3" aria-label="Loading requests">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="h-4 w-28 rounded bg-zinc-200" />
              <div className="h-4 w-44 rounded bg-zinc-200" />
            </div>
            <div className="h-7 w-28 rounded-full bg-zinc-200" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="h-14 rounded-xl bg-zinc-100" />
            <div className="h-14 rounded-xl bg-zinc-100" />
            <div className="h-14 rounded-xl bg-zinc-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RequestList({
  requests,
  isLoading = false,
  onCancel,
}: RequestListProps) {
  if (isLoading) {
    return <LoadingRows />;
  }

  if (!requests.length) {
    return (
      <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-7 text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
          📅
        </div>
        <p className="text-sm font-medium text-zinc-700">
          No time-off requests yet
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Submitted requests will appear here once they are created.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const status = getStatusPresentation(request);
        const canCancel =
          request.status === "pending" && request.optimisticStatus === undefined;
        const resolvedDate =
          request.status === "approved" || request.status === "denied"
            ? formatResolvedDate(request.resolvedAt)
            : null;

        return (
          <article
            key={request.id}
            className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {getLocationName(request.locationId)}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-zinc-950">
                  {formatDateRange(request.startDate, request.endDate)}
                </h3>
                <p className="mt-1 text-sm text-zinc-500">{request.reason}</p>
              </div>

              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-200 ${status.className}`}
              >
                {status.label}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-zinc-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Days
                </p>
                <p className="mt-2 text-base font-semibold text-zinc-900">
                  {request.days} days
                </p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Submitted
                </p>
                <p className="mt-2 text-base font-semibold text-zinc-900">
                  {format(new Date(request.submittedAt), "MMM d, yyyy")}
                </p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Status detail
                </p>
                <p className="mt-2 text-base font-semibold text-zinc-900">
                  {resolvedDate ? `Resolved ${resolvedDate}` : "Awaiting action"}
                </p>
              </div>
            </div>

            {canCancel ? (
              <div className="mt-4 flex justify-end">
                <button
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-all duration-200 hover:border-zinc-400 hover:bg-zinc-50"
                  type="button"
                  onClick={() => onCancel?.(request.id)}
                >
                  Cancel
                </button>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

export default RequestList;
