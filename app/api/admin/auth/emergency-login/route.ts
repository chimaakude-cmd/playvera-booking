import { NextResponse } from "next/server";
import {
  AUTH_ROLE_COOKIE,
  AUTH_ROLE_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";
import type { AdminRole } from "@/lib/admin/types";
import type { AuthUser } from "@/lib/auth/types";
import { getStaffDashboardPath } from "@/lib/auth/staff-access";
import {
  logEmergencyAccessRecovery,
  repairAdminAccessAccount,
  validateEmergencyCredentials,
} from "@/lib/admin-users/emergency-access";
import { isEmergencyLoginApiEnabled } from "@/lib/admin-users/production-gates";
import { createSupabaseServiceRoleClient, isSupabaseConfigured } from "@/lib/supabase";

type EmergencyLoginBody = {
  email?: string;
  pin?: string;
  password?: string;
};

function buildAuthUser(adminUser: {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}): AuthUser {
  return {
    id: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
    role: "admin",
    adminRole: adminUser.role ?? "super_admin",
  };
}

export async function POST(request: Request) {
  if (!isEmergencyLoginApiEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Admin sign-in is not configured. Contact support." },
      { status: 503 },
    );
  }

  let body: EmergencyLoginBody;
  try {
    body = (await request.json()) as EmergencyLoginBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  const pin = body.pin ?? "";
  const password = body.password ?? "";

  if (!email || !pin || !password) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  if (password.trim().length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  if (!validateEmergencyCredentials(email, pin)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  try {
    const repairResult = await repairAdminAccessAccount(email, password);

    if (!repairResult.ok) {
      console.error("[emergency-login] repair failed:", {
        email: email.trim().toLowerCase(),
        error: repairResult.error,
      });
      return NextResponse.json(
        { error: "Unable to recover admin access right now." },
        { status: 500 },
      );
    }

    await logEmergencyAccessRecovery(repairResult.adminUser, "emergency-login");

    const adminUser = repairResult.adminUser;
    const user = buildAuthUser(adminUser);
    const redirectTo = getStaffDashboardPath(adminUser.role);

    const serviceClient = createSupabaseServiceRoleClient();
    await serviceClient
      .from("admin_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", adminUser.id);

    const isProduction = process.env.NODE_ENV === "production";
    const response = NextResponse.json({ ok: true, user, redirectTo });
    response.cookies.set(AUTH_ROLE_COOKIE, "admin", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_ROLE_COOKIE_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("[emergency-login] Unexpected error:", error);
    return NextResponse.json(
      { error: "Unable to recover admin access right now." },
      { status: 500 },
    );
  }
}
