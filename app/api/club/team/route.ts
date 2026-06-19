import { NextResponse } from "next/server";
import { fetchClubTeamForAuthUser } from "@/lib/club-team/server";
import { createSupabaseCookieClient } from "@/lib/supabase-ssr";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  try {
    const supabase = await createSupabaseCookieClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const result = await fetchClubTeamForAuthUser(
      supabase,
      user.id,
      user.email,
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ team: result.state });
  } catch (error) {
    console.error("[club-team] GET failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load team access.",
      },
      { status: 500 },
    );
  }
}
