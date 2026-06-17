import { NextResponse } from "next/server";
import { isEmergencyPinConfigured } from "@/lib/admin-users/emergency-access";

function isEmergencyPinUiEnabled(): boolean {
  return process.env.ADMIN_EMERGENCY_PIN_UI_ENABLED === "true";
}

export async function GET() {
  return NextResponse.json({
    available: isEmergencyPinUiEnabled() && isEmergencyPinConfigured(),
  });
}
