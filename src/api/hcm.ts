import type {
  Balance,
  HCMBatchResponse,
  HCMErrorResponse,
  HCMRequestResponse,
  HCMSingleBalanceResponse,
  TimeOffRequest,
} from "@/types";

type SubmitRequestBody = Pick<
  TimeOffRequest,
  "employeeId" | "locationId" | "days" | "startDate" | "endDate" | "reason"
>;

type ApiErrorCode =
  | HCMErrorResponse["error"]
  | "BALANCE_CHANGED"
  | "UNKNOWN_ERROR";

type ErrorPayload = {
  error: ApiErrorCode;
  available?: number;
  currentBalance?: number;
};

export class HcmApiError extends Error {
  code: ApiErrorCode;
  available?: number;
  currentBalance?: number;

  constructor(payload: ErrorPayload) {
    super(payload.error);
    this.name = "HcmApiError";
    this.code = payload.error;
    this.available = payload.available;
    this.currentBalance = payload.currentBalance;
  }
}

function isErrorPayload(value: unknown): value is ErrorPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "string"
  );
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = (await response.json()) as T | ErrorPayload;

  if (isErrorPayload(data)) {
    throw new HcmApiError(data);
  }

  if (!response.ok) {
    throw new HcmApiError({ error: "UNKNOWN_ERROR" });
  }

  return data;
}

function normalizeBalance(balance: Balance & { lastSyncedAt: string | Date }): Balance {
  return {
    ...balance,
    lastSyncedAt: new Date(balance.lastSyncedAt),
  };
}

function normalizeRequest(
  request: TimeOffRequest & {
    submittedAt: string | Date;
    resolvedAt?: string | Date;
  },
): TimeOffRequest {
  return {
    ...request,
    submittedAt: new Date(request.submittedAt),
    resolvedAt: request.resolvedAt ? new Date(request.resolvedAt) : undefined,
  };
}

export async function fetchAllBalances(): Promise<HCMBatchResponse> {
  const data = await requestJson<HCMBatchResponse>("/api/hcm/balances");

  return {
    ...data,
    balances: data.balances.map((balance) =>
      normalizeBalance(balance as Balance & { lastSyncedAt: string | Date }),
    ),
  };
}

export async function fetchBalance(
  employeeId: string,
  locationId: string,
): Promise<HCMSingleBalanceResponse> {
  const searchParams = new URLSearchParams({ employeeId, locationId });
  const data = await requestJson<HCMSingleBalanceResponse>(
    `/api/hcm/balance?${searchParams.toString()}`,
  );

  return {
    ...data,
    balance: normalizeBalance(
      data.balance as Balance & { lastSyncedAt: string | Date },
    ),
  };
}

export async function submitRequest(
  body: SubmitRequestBody,
): Promise<HCMRequestResponse> {
  return requestJson<HCMRequestResponse>("/api/hcm/request", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function approveRequest(
  requestId: string,
): Promise<{ status: string; newBalance?: number; error?: string }> {
  return requestJson<{ status: string; newBalance?: number; error?: string }>(
    `/api/hcm/request/${requestId}/approve`,
    {
      method: "POST",
    },
  );
}

export async function denyRequest(
  requestId: string,
): Promise<{ status: string }> {
  return requestJson<{ status: string }>(`/api/hcm/request/${requestId}/deny`, {
    method: "POST",
  });
}

export async function triggerAnniversary(
  employeeId: string,
  locationId: string,
): Promise<{ newBalance: number }> {
  return requestJson<{ newBalance: number }>("/api/hcm/trigger-anniversary", {
    method: "POST",
    body: JSON.stringify({ employeeId, locationId }),
  });
}

export async function fetchRequests(): Promise<TimeOffRequest[]> {
  const data = await requestJson<
    Array<
      TimeOffRequest & {
        submittedAt: string | Date;
        resolvedAt?: string | Date;
      }
    >
  >("/api/hcm/requests");

  return data.map(normalizeRequest);
}
