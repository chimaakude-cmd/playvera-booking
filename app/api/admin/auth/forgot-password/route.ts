import { NextResponse } from "next/server";
import { validateAdminEmailForMagicLink } from "@/lib/admin-users/magic-link-auth";
import { resolveServerAppBaseUrl } from "@/lib/app-url";
import { FORGOT_PASSWORD_SUCCESS_MESSAGE } from "@/lib/auth/login-messages";
import { createSupabaseCookieClient } from "@/lib/supabase-ssr";
import { isSupabaseConfigured } from "@/lib/supabase";

type ForgotPasswordBody = {
  email?: string;
};

const GENERIC_SUCCESS_MESSAGE = FORGOT_PASSWORD_SUCCESS_MESSAGE;

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Admin sign-in is not configured. Contact support." },
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
  if (!email) {
    return NextResponse.json(
      { ok: true, message: GENERIC_SUCCESS_MESSAGE },
      { status: 200 },
    );
  }

  try {
    const validation = await validateAdminEmailForMagicLink(email);
    if (!validation.ok) {
      return NextResponse.json({
        ok: true,
        message: GENERIC_SUCCESS_MESSAGE,
      });
    }

    const redirectTo = `${resolveServerAppBaseUrl(request)}/auth/reset-password/callback?portal=admin`;
    const supabase = await createSupabaseCookieClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error("[admin-forgot-password] resetPasswordForEmail failed:", {
        email,
        message: error.message,
        code: error.code,
      });
    }

    return NextResponse.json({
      ok: true,
      message: GENERIC_SUCCESS_MESSAGE,
    });
  } catch (error) {
    console.error("[admin-forgot-password] Unexpected error:", error);
    return NextResponse.json(
      { error: "Unable to send reset instructions right now. Please try again." },
      { status: 500 },
    );
  }
}
