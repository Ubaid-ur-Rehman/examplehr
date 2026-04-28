import { NextRequest, NextResponse } from "next/server";

import {
  applyPendingRequest,
  createRequest,
  employeeHasLocation,
  getBalance,
} from "@/lib/mockHcmStore";
import type {
  HCMErrorResponse,
  HCMRequestResponse,
  TimeOffRequest,
} from "@/types";

interface SubmitRequestBody
  extends Pick<
    TimeOffRequest,
    "employeeId" | "locationId" | "days" | "startDate" | "endDate" | "reason"
  > {}

const SILENT_FAILURE_RATE = 0.05;

export async function POST(request: NextRequest) {
  const body = (await request.json()) as SubmitRequestBody;
  const { employeeId, locationId, days, startDate, endDate, reason } = body;

  if (
    !employeeId ||
    !locationId ||
    typeof days !== "number" ||
    !startDate ||
    !endDate ||
    !reason
  ) {
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400 },
    );
  }

  if (!employeeHasLocation(employeeId, locationId)) {
    const errorResponse: HCMErrorResponse = {
      error: "INVALID_DIMENSION",
    };

    return NextResponse.json(errorResponse, { status: 400 });
  }

  const balance = getBalance(employeeId, locationId);

  if (!balance) {
    const errorResponse: HCMErrorResponse = {
      error: "INVALID_DIMENSION",
    };

    return NextResponse.json(errorResponse, { status: 400 });
  }

  if (days > balance.available) {
    const errorResponse: HCMErrorResponse = {
      error: "INSUFFICIENT_BALANCE",
      available: balance.available,
    };

    return NextResponse.json(errorResponse, { status: 400 });
  }

  const response: HCMRequestResponse = {
    requestId: crypto.randomUUID(),
    status: "accepted",
  };

  if (Math.random() < SILENT_FAILURE_RATE) {
    return NextResponse.json(response);
  }

  const createdRequest = createRequest({
    employeeId,
    locationId,
    days,
    startDate,
    endDate,
    reason,
  });

  applyPendingRequest(employeeId, locationId, days);

  return NextResponse.json({
    requestId: createdRequest.id,
    status: response.status,
  } satisfies HCMRequestResponse);
}
