import type { Balance, EmployeeId, LocationId, TimeOffRequest } from "@/types";

type SubmitRequestInput = Pick<
  TimeOffRequest,
  "employeeId" | "locationId" | "days" | "startDate" | "endDate" | "reason"
>;

interface MockHcmStore {
  balances: Balance[];
  requests: TimeOffRequest[];
}

const initialBalances = (): Balance[] => {
  const now = new Date();

  return [
    {
      employeeId: "emp-1",
      locationId: "loc-nyc",
      available: 12,
      pending: 0,
      lastSyncedAt: now,
      isFresh: true,
    },
    {
      employeeId: "emp-1",
      locationId: "loc-sf",
      available: 8,
      pending: 0,
      lastSyncedAt: now,
      isFresh: true,
    },
    {
      employeeId: "emp-2",
      locationId: "loc-nyc",
      available: 5,
      pending: 0,
      lastSyncedAt: now,
      isFresh: true,
    },
    {
      employeeId: "emp-2",
      locationId: "loc-chicago",
      available: 10,
      pending: 0,
      lastSyncedAt: now,
      isFresh: true,
    },
  ];
};

const createStore = (): MockHcmStore => ({
  balances: initialBalances(),
  requests: [],
});

declare global {
  // eslint-disable-next-line no-var
  var __exampleHrMockHcmStore__: MockHcmStore | undefined;
}

const store = globalThis.__exampleHrMockHcmStore__ ?? createStore();

if (!globalThis.__exampleHrMockHcmStore__) {
  globalThis.__exampleHrMockHcmStore__ = store;
}

export function getAllBalances(): Balance[] {
  return store.balances;
}

export function getBalance(
  employeeId: EmployeeId,
  locationId: LocationId,
): Balance | undefined {
  return store.balances.find(
    (balance) =>
      balance.employeeId === employeeId && balance.locationId === locationId,
  );
}

export function employeeHasLocation(
  employeeId: EmployeeId,
  locationId: LocationId,
): boolean {
  return Boolean(getBalance(employeeId, locationId));
}

export function getAllRequests(): TimeOffRequest[] {
  return store.requests;
}

export function getRequestById(id: string): TimeOffRequest | undefined {
  return store.requests.find((request) => request.id === id);
}

export function createRequest(input: SubmitRequestInput): TimeOffRequest {
  const request: TimeOffRequest = {
    id: crypto.randomUUID(),
    employeeId: input.employeeId,
    locationId: input.locationId,
    days: input.days,
    startDate: input.startDate,
    endDate: input.endDate,
    reason: input.reason,
    status: "pending",
    submittedAt: new Date(),
  };

  store.requests.push(request);

  return request;
}

export function markRequestApproved(id: string): TimeOffRequest | undefined {
  const request = getRequestById(id);

  if (!request) {
    return undefined;
  }

  request.status = "approved";
  request.resolvedAt = new Date();

  return request;
}

export function markRequestDenied(id: string): TimeOffRequest | undefined {
  const request = getRequestById(id);

  if (!request) {
    return undefined;
  }

  request.status = "denied";
  request.resolvedAt = new Date();

  return request;
}

export function applyPendingRequest(
  employeeId: EmployeeId,
  locationId: LocationId,
  days: number,
): Balance | undefined {
  const balance = getBalance(employeeId, locationId);

  if (!balance) {
    return undefined;
  }

  balance.available -= days;
  balance.pending += days;
  balance.lastSyncedAt = new Date();
  balance.isFresh = true;

  return balance;
}

export function approvePendingRequest(
  employeeId: EmployeeId,
  locationId: LocationId,
  days: number,
): Balance | undefined {
  const balance = getBalance(employeeId, locationId);

  if (!balance) {
    return undefined;
  }

  balance.pending = Math.max(0, balance.pending - days);
  balance.lastSyncedAt = new Date();
  balance.isFresh = true;

  return balance;
}

export function denyPendingRequest(
  employeeId: EmployeeId,
  locationId: LocationId,
  days: number,
): Balance | undefined {
  const balance = getBalance(employeeId, locationId);

  if (!balance) {
    return undefined;
  }

  balance.pending = Math.max(0, balance.pending - days);
  balance.available += days;
  balance.lastSyncedAt = new Date();
  balance.isFresh = true;

  return balance;
}

export function addAnniversaryBonus(
  employeeId: EmployeeId,
  locationId: LocationId,
  days = 5,
): Balance | undefined {
  const balance = getBalance(employeeId, locationId);

  if (!balance) {
    return undefined;
  }

  balance.available += days;
  balance.lastSyncedAt = new Date();
  balance.isFresh = true;

  return balance;
}
