import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_ROLE_COOKIE,
  AUTH_ROLE_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";
import { TEST_ADMIN_SESSION_COOKIE } from "@/lib/auth/test-admin-session";
import { createSupabaseRouteClient } from "@/lib/supabase-ssr";

function expiredCookie(name: string, isProduction: boolean) {
  return {
    name,
    value: "",
    options: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 0,
    },
  };
}

export async function POST(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === "production";
  const response = NextResponse.json({ ok: true });

  try {
    const supabase = createSupabaseRouteClient(request, response);
    await supabase.auth.signOut();
  } catch (error) {
    console.error("[admin-auth-logout] signOut failed:", error);
  }

  for (const cookie of [
    expiredCookie(AUTH_ROLE_COOKIE, isProduction),
    expiredCookie(TEST_ADMIN_SESSION_COOKIE, isProduction),
  ]) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  return response;
}
