import { NextResponse } from "next/server";

import {
  approvePendingRequest,
  getBalance,
  getRequestById,
  markRequestApproved,
} from "@/lib/mockHcmStore";

const BALANCE_CHANGED_RATE = 0.1;

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const existingRequest = getRequestById(params.id);

  if (!existingRequest) {
    return NextResponse.json(
      { error: "Request not found" },
      { status: 404 },
    );
  }

  if (Math.random() < BALANCE_CHANGED_RATE) {
    const currentBalance = getBalance(
      existingRequest.employeeId,
      existingRequest.locationId,
    );

    return NextResponse.json(
      {
        error: "BALANCE_CHANGED",
        currentBalance: currentBalance?.available ?? 0,
      },
      { status: 409 },
    );
  }

  const updatedRequest = markRequestApproved(existingRequest.id);
  const newBalance = approvePendingRequest(
    existingRequest.employeeId,
    existingRequest.locationId,
    existingRequest.days,
  );

  return NextResponse.json({
    status: updatedRequest?.status ?? "approved",
    newBalance: newBalance?.available ?? 0,
  });
}
