import { NextResponse } from "next/server";
import {
  AUTH_ROLE_COOKIE,
  AUTH_ROLE_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";
import type { AdminRole } from "@/lib/admin/types";
import type { AuthUser } from "@/lib/auth/types";
import { getStaffDashboardPath } from "@/lib/auth/staff-access";
import {
  adminAuthLoginErrorMessage,
  authenticateAdminWithPassword,
} from "@/lib/admin-users/supabase-auth";
import { createSupabaseServiceRoleClient, isSupabaseConfigured } from "@/lib/supabase";

type LoginBody = {
  email?: string;
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
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: adminAuthLoginErrorMessage("auth_not_configured") },
      { status: 503 },
    );
  }

  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: adminAuthLoginErrorMessage("account_not_found") },
      { status: 400 },
    );
  }

  try {
    const result = await authenticateAdminWithPassword(email, password);

    if (!result.ok) {
      const status =
        result.error === "password_incorrect"
          ? 401
          : result.error === "auth_not_configured"
            ? 503
            : 403;

      return NextResponse.json(
        {
          error: adminAuthLoginErrorMessage(result.error),
          code: result.error,
        },
        { status },
      );
    }

    const adminUser = result.adminUser;
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
    console.error("[Admin auth login] Unexpected error:", error);
    return NextResponse.json(
      { error: "Unable to sign in right now. Please try again." },
      { status: 500 },
    );
  }
}
