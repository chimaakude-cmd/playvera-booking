import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_ROLE_COOKIE } from "@/lib/auth/constants";
import { createSupabaseRouteClient } from "@/lib/supabase-ssr";
import { verifyAdminAfterMagicLinkAuth } from "./magic-link-auth";
import type { AdminUserActor } from "./server-store";

export function hasAdminRoleCookie(request: NextRequest | Request): boolean {
  if ("cookies" in request && typeof request.cookies.get === "function") {
    return request.cookies.get(AUTH_ROLE_COOKIE)?.value === "admin";
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  return cookieHeader.split(";").some((part) => {
    const [name, value] = part.trim().split("=");
    return name === AUTH_ROLE_COOKIE && value === "admin";
  });
}

/**
 * Resolves a verified admin actor from Supabase session cookies + admin_users row.
 */
export async function resolveVerifiedAdminActor(
  request: NextRequest,
  response?: NextResponse,
): Promise<AdminUserActor | null> {
  if (!hasAdminRoleCookie(request)) {
    return null;
  }

  const cookieResponse = response ?? NextResponse.next();
  const supabase = createSupabaseRouteClient(request, cookieResponse);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email || !user.id) {
    return null;
  }

  const verifyResult = await verifyAdminAfterMagicLinkAuth(user.email, user.id);
  if (!verifyResult.ok) {
    return null;
  }

  const adminUser = verifyResult.adminUser;
  return {
    adminId: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
    role: adminUser.role,
  };
}
