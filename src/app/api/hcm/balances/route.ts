import { NextResponse } from "next/server";

import { getAllBalances } from "@/lib/mockHcmStore";
import type { HCMBatchResponse } from "@/types";

export async function GET() {
  const response: HCMBatchResponse = {
    balances: getAllBalances(),
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(response);
}
