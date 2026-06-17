import { NextResponse } from "next/server";
import { resolveServerAppBaseUrl } from "@/lib/app-url";
import {
  adminMagicLinkLookupErrorMessage,
  ADMIN_MAGIC_LINK_CALLBACK_PATH,
  validateAdminEmailForMagicLink,
} from "@/lib/admin-users/magic-link-auth";
import { createSupabaseCookieClient } from "@/lib/supabase-ssr";
import { isSupabaseConfigured } from "@/lib/supabase";

type MagicLinkBody = {
  email?: string;
};

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: adminMagicLinkLookupErrorMessage("auth_not_configured") },
      { status: 503 },
    );
  }

  let body: MagicLinkBody;
  try {
    body = (await request.json()) as MagicLinkBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email) {
    return NextResponse.json(
      { error: adminMagicLinkLookupErrorMessage("not_authorised") },
      { status: 400 },
    );
  }

  try {
    const validation = await validateAdminEmailForMagicLink(email);
    if (!validation.ok) {
      const status =
        validation.error === "auth_not_configured"
          ? 503
          : validation.error === "inactive"
            ? 403
            : 403;

      return NextResponse.json(
        { error: adminMagicLinkLookupErrorMessage(validation.error) },
        { status },
      );
    }

    const emailRedirectTo = `${resolveServerAppBaseUrl(request)}${ADMIN_MAGIC_LINK_CALLBACK_PATH}`;
    const supabase = await createSupabaseCookieClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      console.error("[admin-magic-link] signInWithOtp failed:", {
        email: email.trim().toLowerCase(),
        message: error.message,
        code: error.code,
      });
      return NextResponse.json(
        { error: "Unable to send sign-in link right now. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Check your email for the sign-in link",
    });
  } catch (error) {
    console.error("[admin-magic-link] Unexpected error:", error);
    return NextResponse.json(
      { error: "Unable to send sign-in link right now. Please try again." },
      { status: 500 },
    );
  }
}
