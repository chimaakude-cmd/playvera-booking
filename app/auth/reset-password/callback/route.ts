import { NextRequest, NextResponse } from "next/server";
import { resolveServerAppBaseUrl } from "@/lib/app-url";
import { createSupabaseRouteClient } from "@/lib/supabase-ssr";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const authError = searchParams.get("error");
  const portal = searchParams.get("portal") ?? "club";

  const origin = resolveServerAppBaseUrl(request);
  const resetUrl = new URL("/auth/reset-password", origin);
  resetUrl.searchParams.set("portal", portal);

  if (authError || !code) {
    resetUrl.searchParams.set("error", "link_expired");
    return NextResponse.redirect(resetUrl);
  }

  const redirectResponse = NextResponse.redirect(resetUrl);

  try {
    const supabase = createSupabaseRouteClient(request, redirectResponse);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[reset-password-callback] exchangeCodeForSession failed:", {
        message: error.message,
        code: error.code,
      });
      resetUrl.searchParams.set("error", "link_expired");
      return NextResponse.redirect(resetUrl);
    }

    return redirectResponse;
  } catch (error) {
    console.error("[reset-password-callback] Unexpected error:", error);
    resetUrl.searchParams.set("error", "link_expired");
    return NextResponse.redirect(resetUrl);
  }
}
