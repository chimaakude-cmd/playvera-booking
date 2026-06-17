import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_ROLE_COOKIE,
  AUTH_ROLE_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";
import { getStaffDashboardPath } from "@/lib/auth/staff-access";
import {
  adminMagicLinkCallbackErrorMessage,
  verifyAdminAfterMagicLinkAuth,
} from "@/lib/admin-users/magic-link-auth";
import { resolveServerAppBaseUrl } from "@/lib/app-url";
import { createSupabaseRouteClient } from "@/lib/supabase-ssr";
import { createSupabaseServiceRoleClient } from "@/lib/supabase";

function loginRedirect(
  request: NextRequest,
  errorCode: Parameters<typeof adminMagicLinkCallbackErrorMessage>[0],
): NextResponse {
  const origin = resolveServerAppBaseUrl(request);
  const loginUrl = new URL("/admin/login", origin);
  loginUrl.searchParams.set("error", adminMagicLinkCallbackErrorMessage(errorCode));
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const authError = searchParams.get("error");
  const authErrorDescription = searchParams.get("error_description");

  if (authError) {
    console.info("[admin-auth-callback] Supabase auth error:", {
      error: authError,
      description: authErrorDescription,
    });
    return loginRedirect(request, "link_expired");
  }

  if (!code) {
    return loginRedirect(request, "link_expired");
  }

  const origin = resolveServerAppBaseUrl(request);
  const completeUrl = new URL("/admin/auth/complete", origin);
  const redirectResponse = NextResponse.redirect(completeUrl);

  try {
    const supabase = createSupabaseRouteClient(request, redirectResponse);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user?.email || !data.user.id) {
      console.info("[admin-auth-callback] exchangeCodeForSession failed:", {
        message: error?.message ?? null,
        code: error?.code ?? null,
      });
      return loginRedirect(request, "link_expired");
    }

    const verifyResult = await verifyAdminAfterMagicLinkAuth(
      data.user.email,
      data.user.id,
    );

    if (!verifyResult.ok) {
      await supabase.auth.signOut();
      return loginRedirect(request, verifyResult.error);
    }

    const redirectTo = getStaffDashboardPath(verifyResult.adminUser.role);
    completeUrl.searchParams.set("redirectTo", redirectTo);

    const serviceClient = createSupabaseServiceRoleClient();
    await serviceClient
      .from("admin_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", verifyResult.adminUser.id);

    const isProduction = process.env.NODE_ENV === "production";
    redirectResponse.cookies.set(AUTH_ROLE_COOKIE, "admin", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_ROLE_COOKIE_MAX_AGE_SECONDS,
    });

    return NextResponse.redirect(completeUrl, {
      headers: redirectResponse.headers,
    });
  } catch (error) {
    console.error("[admin-auth-callback] Unexpected error:", error);
    return loginRedirect(request, "link_expired");
  }
}
