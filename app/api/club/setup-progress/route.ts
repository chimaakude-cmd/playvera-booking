import { NextResponse } from "next/server";
import { fetchSetupProgressForAuthUser } from "@/lib/club-setup/server";
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

    if (authError || !user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const progress = await fetchSetupProgressForAuthUser(supabase, user.id);
    if (!progress) {
      return NextResponse.json(
        { error: "No club account found for this user." },
        { status: 404 },
      );
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("[club-setup-progress] GET failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load setup progress.",
      },
      { status: 500 },
    );
  }
}
