import { NextResponse } from "next/server";
import {
  getEmergencyEmail,
  logEmergencyAccessRecovery,
  repairAdminAccessAccount,
  validateRepairToken,
} from "@/lib/admin-users/emergency-access";
import { isSupabaseConfigured } from "@/lib/supabase";

type RepairAccessBody = {
  token?: string;
  password?: string;
};

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Admin access repair is not configured." },
      { status: 503 },
    );
  }

  let body: RepairAccessBody;
  try {
    body = (await request.json()) as RepairAccessBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const token = body.token?.trim() ?? "";
  const password = body.password ?? "";

  if (!token || !password) {
    return NextResponse.json({ error: "Invalid repair request." }, { status: 401 });
  }

  if (password.trim().length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  if (!validateRepairToken(token)) {
    return NextResponse.json({ error: "Invalid repair request." }, { status: 401 });
  }

  const email = getEmergencyEmail();

  try {
    const repairResult = await repairAdminAccessAccount(email, password);

    if (!repairResult.ok) {
      console.error("[repair-access] repair failed:", {
        email,
        error: repairResult.error,
      });
      return NextResponse.json(
        { error: "Unable to repair admin access right now." },
        { status: 500 },
      );
    }

    await logEmergencyAccessRecovery(repairResult.adminUser, "repair-access");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[repair-access] Unexpected error:", error);
    return NextResponse.json(
      { error: "Unable to repair admin access right now." },
      { status: 500 },
    );
  }
}
