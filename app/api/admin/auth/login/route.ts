import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_ROLE_COOKIE,
  AUTH_ROLE_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";
import type { AdminRole } from "@/lib/admin/types";
import type { AuthUser } from "@/lib/auth/types";
import { getStaffDashboardPath } from "@/lib/auth/staff-access";
import {
  adminAuthLoginErrorMessage,
  type AdminAuthLoginError,
} from "@/lib/admin-users/supabase-auth";
import { verifyAdminAfterMagicLinkAuth } from "@/lib/admin-users/magic-link-auth";
import { createSupabaseRouteClient } from "@/lib/supabase-ssr";
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

export async function POST(request: NextRequest) {
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

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: adminAuthLoginErrorMessage("account_not_found") },
      { status: 400 },
    );
  }

  const isProduction = process.env.NODE_ENV === "production";

  try {
    const successResponse = NextResponse.json({ ok: true });
    const supabase = createSupabaseRouteClient(request, successResponse);
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData.user?.email || !authData.user.id) {
      const serviceClient = createSupabaseServiceRoleClient();
      const { data: adminRow } = await serviceClient
        .from("admin_users")
        .select("auth_user_id, status")
        .eq("email", email)
        .maybeSingle();

      const errorCode: AdminAuthLoginError =
        adminRow?.auth_user_id && adminRow.status === "active"
          ? "password_mismatch_auth"
          : adminRow
            ? adminRow.status !== "active"
              ? "access_not_active"
              : "password_incorrect"
            : "account_not_found";

      const status =
        errorCode === "password_incorrect" ||
        errorCode === "password_mismatch_auth"
          ? 401
          : 403;

      return NextResponse.json(
        {
          error: adminAuthLoginErrorMessage(errorCode),
          code: errorCode,
        },
        { status },
      );
    }

    const verifyResult = await verifyAdminAfterMagicLinkAuth(
      authData.user.email,
      authData.user.id,
    );

    if (!verifyResult.ok) {
      await supabase.auth.signOut();
      const errorCode: AdminAuthLoginError =
        verifyResult.error === "inactive"
          ? "access_not_active"
          : "account_not_found";

      return NextResponse.json(
        {
          error: adminAuthLoginErrorMessage(errorCode),
          code: errorCode,
        },
        { status: 403 },
      );
    }

    const adminUser = verifyResult.adminUser;
    const user = buildAuthUser(adminUser);
    const redirectTo = getStaffDashboardPath(adminUser.role);

    const serviceClient = createSupabaseServiceRoleClient();
    await serviceClient
      .from("admin_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", adminUser.id);

    const jsonResponse = NextResponse.json({ ok: true, user, redirectTo });

    for (const cookie of successResponse.cookies.getAll()) {
      jsonResponse.cookies.set(cookie.name, cookie.value);
    }

    jsonResponse.cookies.set(AUTH_ROLE_COOKIE, "admin", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_ROLE_COOKIE_MAX_AGE_SECONDS,
    });

    return jsonResponse;
  } catch (error) {
    console.error("[Admin auth login] Unexpected error:", error);
    return NextResponse.json(
      { error: "Unable to sign in right now. Please try again." },
      { status: 500 },
    );
  }
}
