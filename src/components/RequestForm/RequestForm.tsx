import { differenceInCalendarDays, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";

import type { Balance } from "@/types";

interface RequestFormData {
  locationId: string;
  days: number;
  startDate: string;
  endDate: string;
  reason: string;
}

interface RequestFormProps {
  employeeId: string;
  balances: Balance[];
  onSubmit: (data: RequestFormData) => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}

const LOCATION_NAMES: Record<string, string> = {
  "loc-nyc": "New York",
  "loc-sf": "San Francisco",
  "loc-chicago": "Chicago",
};

function getLocationLabel(locationId: string) {
  if (LOCATION_NAMES[locationId]) {
    return LOCATION_NAMES[locationId];
  }

  return locationId
    .replace(/^loc-/, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function calculateDays(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const difference = differenceInCalendarDays(end, start);

  return difference >= 0 ? difference + 1 : 0;
}

export function RequestForm({
  employeeId,
  balances,
  onSubmit,
  isSubmitting = false,
  submitError = null,
}: RequestFormProps) {
  const employeeBalances = useMemo(
    () => balances.filter((balance) => balance.employeeId === employeeId),
    [balances, employeeId],
  );

  const [locationId, setLocationId] = useState(employeeBalances[0]?.locationId ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState(0);
  const [reason, setReason] = useState("");
  const [daysTouched, setDaysTouched] = useState(false);

  useEffect(() => {
    if (!employeeBalances.length) {
      setLocationId("");
      return;
    }

    if (!employeeBalances.some((balance) => balance.locationId === locationId)) {
      setLocationId(employeeBalances[0].locationId);
    }
  }, [employeeBalances, locationId]);

  useEffect(() => {
    if (daysTouched) {
      return;
    }

    if (!startDate || !endDate) {
      return;
    }

    setDays(calculateDays(startDate, endDate));
  }, [startDate, endDate, daysTouched]);

  const selectedBalance = employeeBalances.find(
    (balance) => balance.locationId === locationId,
  );

  const validation = useMemo(() => {
    const errors: Partial<Record<keyof RequestFormData, string>> = {};

    if (!locationId && employeeBalances.length) {
      errors.locationId = "Please select a location.";
    }

    if (startDate && endDate && parseISO(endDate) < parseISO(startDate)) {
      errors.endDate = "End date cannot be before start date.";
    }

    if (!reason.trim()) {
      errors.reason = "Reason is required.";
    }

    if (!days || days <= 0) {
      errors.days = "Days must be greater than 0.";
    } else if (selectedBalance && days > selectedBalance.available) {
      errors.days = "Days cannot exceed available balance.";
    }

    return errors;
  }, [days, employeeBalances.length, endDate, locationId, reason, selectedBalance, startDate]);

  const remainingBalance =
    selectedBalance && days > 0 ? selectedBalance.available - days : null;

  const isFormValid =
    employeeBalances.length > 0 &&
    locationId.length > 0 &&
    startDate.length > 0 &&
    endDate.length > 0 &&
    reason.trim().length > 0 &&
    Object.keys(validation).length === 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isFormValid) {
      return;
    }

    onSubmit({
      locationId,
      days,
      startDate,
      endDate,
      reason: reason.trim(),
    });

    setStartDate("");
    setEndDate("");
    setDays(0);
    setReason("");
    setDaysTouched(false);
  }

  if (!employeeBalances.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
        <p className="text-sm font-medium text-zinc-700">No locations available</p>
        <p className="mt-1 text-sm text-zinc-500">
          This employee does not have any balance records yet.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-5 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-5 sm:p-6"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-700">Location</span>
          <select
            aria-label="Location"
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
            disabled={isSubmitting}
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
          >
            {employeeBalances.map((balance) => (
              <option key={balance.locationId} value={balance.locationId}>
                {getLocationLabel(balance.locationId)}
              </option>
            ))}
          </select>
          {validation.locationId ? (
            <p className="text-sm text-red-600">{validation.locationId}</p>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-700">Days</span>
          <input
            aria-label="Days"
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
            disabled={isSubmitting}
            min={0}
            step={1}
            type="number"
            value={days}
            onChange={(event) => {
              setDaysTouched(true);
              setDays(Number(event.target.value));
            }}
          />
          {validation.days ? (
            <p className="text-sm text-red-600">{validation.days}</p>
          ) : null}
          {selectedBalance && remainingBalance !== null && !validation.days ? (
            <p className="text-sm text-zinc-500">
              You will have {remainingBalance} days remaining
            </p>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-700">Start date</span>
          <input
            aria-label="Start date"
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
            disabled={isSubmitting}
            type="date"
            value={startDate}
            onChange={(event) => {
              setDaysTouched(false);
              setStartDate(event.target.value);
            }}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-zinc-700">End date</span>
          <input
            aria-label="End date"
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
            disabled={isSubmitting}
            type="date"
            value={endDate}
            onChange={(event) => {
              setDaysTouched(false);
              setEndDate(event.target.value);
            }}
          />
          {validation.endDate ? (
            <p className="text-sm text-red-600">{validation.endDate}</p>
          ) : null}
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-zinc-700">Reason</span>
        <textarea
          aria-label="Reason"
          className="min-h-28 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
          disabled={isSubmitting}
          placeholder="Add context for your time-off request"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        {validation.reason ? (
          <p className="text-sm text-red-600">{validation.reason}</p>
        ) : null}
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-zinc-500">
          {selectedBalance ? (
            <span>{getLocationLabel(selectedBalance.locationId)} balance: {selectedBalance.available} days</span>
          ) : null}
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 hover:shadow disabled:cursor-not-allowed disabled:bg-indigo-300"
          disabled={isSubmitting || !isFormValid}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Submitting...
            </>
          ) : (
            "Submit request"
          )}
        </button>
      </div>

      {submitError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {submitError}
        </p>
      ) : null}
    </form>
  );
}

export default RequestForm;
