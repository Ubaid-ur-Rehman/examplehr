import { NextRequest, NextResponse } from "next/server";

import { addAnniversaryBonus } from "@/lib/mockHcmStore";

interface TriggerAnniversaryBody {
  employeeId: string;
  locationId: string;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as TriggerAnniversaryBody;
  const { employeeId, locationId } = body;

  if (!employeeId || !locationId) {
    return NextResponse.json(
      { error: "employeeId and locationId are required" },
      { status: 400 },
    );
  }

  const updatedBalance = addAnniversaryBonus(employeeId, locationId);

  if (!updatedBalance) {
    return NextResponse.json(
      { error: "Balance not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    newBalance: updatedBalance.available,
  });
}
