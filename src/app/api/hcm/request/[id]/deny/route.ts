import { NextResponse } from "next/server";

import {
  denyPendingRequest,
  getRequestById,
  markRequestDenied,
} from "@/lib/mockHcmStore";

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

  markRequestDenied(existingRequest.id);
  denyPendingRequest(
    existingRequest.employeeId,
    existingRequest.locationId,
    existingRequest.days,
  );

  return NextResponse.json({
    status: "denied",
    reason: "Manager denied the request",
  });
}
