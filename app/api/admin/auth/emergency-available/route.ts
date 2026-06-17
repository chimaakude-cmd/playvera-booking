import { NextResponse } from "next/server";
import { isEmergencyPinUiEnabled } from "@/lib/admin-users/production-gates";

export async function GET() {
  return NextResponse.json({
    available: isEmergencyPinUiEnabled(),
  });
}
