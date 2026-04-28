import { NextResponse } from "next/server";

import { getAllRequests } from "@/lib/mockHcmStore";

export async function GET() {
  return NextResponse.json(getAllRequests());
}
