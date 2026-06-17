import { NextResponse } from "next/server";
import { isEmergencyPinConfigured } from "@/lib/admin-users/emergency-access";

export async function GET() {
  return NextResponse.json({ available: isEmergencyPinConfigured() });
}
