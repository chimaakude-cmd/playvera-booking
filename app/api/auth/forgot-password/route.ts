import { NextResponse } from "next/server";
import { resolveServerAppBaseUrl } from "@/lib/app-url";
import {
  FORGOT_PASSWORD_SUCCESS_MESSAGE,
  isValidLoginEmail,
  loginErrorMessage,
  type LoginErrorKind,
} from "@/lib/auth/login-messages";
import type { PortalLoginRole } from "@/lib/auth/portal-login-server";
import type { UserRole } from "@/lib/auth/types";
import { createSupabaseCookieClient } from "@/lib/supabase-ssr";
import { isSupabaseConfigured } from "@/lib/supabase";

type ForgotPasswordBody = {
  email?: string;
  portal?: PortalLoginRole | UserRole;
};

const VALID_PORTALS = new Set<string>([
  "club",
  "parent",
  "organisation",
  "admin",
]);

function buildResetRedirectUrl(request: Request, portal: string): string {
  const base = resolveServerAppBaseUrl(request);
  return `${base}/auth/reset-password/callback?portal=${encodeURIComponent(portal)}`;
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: loginErrorMessage("generic") },
      { status: 503 },
    );
  }

  let body: ForgotPasswordBody;
  try {
    body = (await request.json()) as ForgotPasswordBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const portal = body.portal?.trim().toLowerCase() ?? "club";

  if (!VALID_PORTALS.has(portal)) {
    return NextResponse.json({ error: "Invalid portal." }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({
      ok: true,
      message: FORGOT_PASSWORD_SUCCESS_MESSAGE,
    });
  }

  if (!isValidLoginEmail(email)) {
    return NextResponse.json(
      {
        error: loginErrorMessage("invalidEmail"),
        kind: "invalidEmail" satisfies LoginErrorKind,
      },
      { status: 400 },
    );
  }

  try {
    const redirectTo = buildResetRedirectUrl(request, portal);
    const supabase = await createSupabaseCookieClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error("[forgot-password] resetPasswordForEmail failed:", {
        email,
        portal,
        message: error.message,
        code: error.code,
      });
    }

    return NextResponse.json({
      ok: true,
      message: FORGOT_PASSWORD_SUCCESS_MESSAGE,
    });
  } catch (error) {
    console.error("[forgot-password] Unexpected error:", error);
    return NextResponse.json(
      { error: loginErrorMessage("generic") },
      { status: 500 },
    );
  }
}
