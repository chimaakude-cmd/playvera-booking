import { NextResponse } from "next/server";
import {
  AUTH_ROLE_COOKIE,
  AUTH_ROLE_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";
import type { AdminRole } from "@/lib/admin/types";
import type { AuthUser } from "@/lib/auth/types";
import { getStaffDashboardPath } from "@/lib/auth/staff-access";
import { verifyAdminAfterMagicLinkAuth } from "@/lib/admin-users/magic-link-auth";
import { createSupabaseCookieClient } from "@/lib/supabase-ssr";

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

function hasAdminRoleCookie(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie") ?? "";
  return cookieHeader.split(";").some((part) => {
    const [name, value] = part.trim().split("=");
    return name === AUTH_ROLE_COOKIE && value === "admin";
  });
}

export async function GET(request: Request) {
  if (!hasAdminRoleCookie(request)) {
    return NextResponse.json(
      { error: "Admin session not found." },
      { status: 401 },
    );
  }

  try {
    const supabase = await createSupabaseCookieClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.email || !user.id) {
      return NextResponse.json(
        { error: "Sign-in session expired." },
        { status: 401 },
      );
    }

    const verifyResult = await verifyAdminAfterMagicLinkAuth(user.email, user.id);
    if (!verifyResult.ok) {
      return NextResponse.json(
        { error: "This email is not authorised for admin access." },
        { status: 403 },
      );
    }

    const adminUser = verifyResult.adminUser;
    const authUser = buildAuthUser(adminUser);
    const redirectTo = getStaffDashboardPath(adminUser.role);

    const isProduction = process.env.NODE_ENV === "production";
    const response = NextResponse.json({ ok: true, user: authUser, redirectTo });
    response.cookies.set(AUTH_ROLE_COOKIE, "admin", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_ROLE_COOKIE_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("[admin-auth-bootstrap] Unexpected error:", error);
    return NextResponse.json(
      { error: "Unable to complete sign-in right now." },
      { status: 500 },
    );
  }
}
