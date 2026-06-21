import { NextResponse } from "next/server";
import { createSupabaseCookieClient } from "@/lib/supabase-ssr";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  repairPublicClubProfileForProvider,
  resolveProviderIdForAuthUser,
} from "@/lib/club-profile/server";

export async function POST() {
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

    if (authError || !user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const providerId = await resolveProviderIdForAuthUser(supabase, user.id);
    if (!providerId) {
      return NextResponse.json(
        { error: "No club account found for this user." },
        { status: 404 },
      );
    }

    const result = await repairPublicClubProfileForProvider(supabase, providerId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      profile: result.profile,
      health: result.health,
      repaired: true,
    });
  } catch (error) {
    console.error("[club-profile] repair failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not repair club profile.",
      },
      { status: 500 },
    );
  }
}
