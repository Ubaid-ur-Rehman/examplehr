import { NextRequest, NextResponse } from "next/server";

import { getBalance } from "@/lib/mockHcmStore";
import type { HCMSingleBalanceResponse } from "@/types";

const SLOW_RESPONSE_RATE = 0.1;
const SLOW_RESPONSE_DELAY_MS = 2_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  const employeeId = request.nextUrl.searchParams.get("employeeId");
  const locationId = request.nextUrl.searchParams.get("locationId");

  if (!employeeId || !locationId) {
    return NextResponse.json(
      { error: "employeeId and locationId are required" },
      { status: 400 },
    );
  }

  if (Math.random() < SLOW_RESPONSE_RATE) {
    await sleep(SLOW_RESPONSE_DELAY_MS);
  }

  const balance = getBalance(employeeId, locationId);

  if (!balance) {
    return NextResponse.json(
      { error: "Balance not found" },
      { status: 404 },
    );
  }

  const response: HCMSingleBalanceResponse = {
    balance,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(response);
}
