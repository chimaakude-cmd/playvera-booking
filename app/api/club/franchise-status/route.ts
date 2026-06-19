import { NextRequest, NextResponse } from "next/server";
import { fetchClubFranchiseStatus } from "@/lib/organisation/franchise-status";
import { resolveProviderIdForAuthUser } from "@/lib/club-profile/server";
import { createSupabaseCookieClient } from "@/lib/supabase-ssr";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      isManaged: false,
      franchisorId: null,
      franchisorName: null,
      organisationType: "club",
    });
  }

  try {
    const supabase = await createSupabaseCookieClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const requestedProviderId =
      request.nextUrl.searchParams.get("providerId")?.trim() ?? null;
    const authProviderId = await resolveProviderIdForAuthUser(supabase, user.id);

    if (!authProviderId) {
      return NextResponse.json(
        { error: "No club account found for this user." },
        { status: 404 },
      );
    }

    const providerId =
      requestedProviderId && requestedProviderId === authProviderId
        ? requestedProviderId
        : authProviderId;

    const status = await fetchClubFranchiseStatus(supabase, providerId);
    return NextResponse.json(status);
  } catch (error) {
    console.error("[club-franchise-status] GET failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load franchise status.",
      },
      { status: 500 },
    );
  }
}
