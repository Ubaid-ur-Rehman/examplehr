export type LocationId = string;
export type EmployeeId = string;

export interface Balance {
  employeeId: EmployeeId;
  locationId: LocationId;
  available: number;
  pending: number;
  lastSyncedAt: Date;
  isFresh: boolean;
}

export interface TimeOffRequest {
  id: string;
  employeeId: EmployeeId;
  locationId: LocationId;
  days: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "denied" | "cancelled";
  optimisticStatus?: "submitting" | "pending-confirm" | "rolled-back";
  submittedAt: Date;
  resolvedAt?: Date;
}

export interface HCMBatchResponse {
  balances: Balance[];
  generatedAt: string;
}

export interface HCMSingleBalanceResponse {
  balance: Balance;
  generatedAt: string;
}

export interface HCMRequestResponse {
  requestId: string;
  status: "accepted";
}

export interface HCMErrorResponse {
  error: "INSUFFICIENT_BALANCE" | "INVALID_DIMENSION" | "SILENT_FAILURE";
  available?: number;
}

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  createdAt: Date;
}
