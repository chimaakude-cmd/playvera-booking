import { NextRequest, NextResponse } from "next/server";
import { createSupabaseCookieClient } from "@/lib/supabase-ssr";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  fetchClubProfileForProvider,
  resolveProviderIdForAuthUser,
  saveClubProfileForProvider,
} from "@/lib/club-profile/server";
import type { ClubProfileInput } from "@/lib/club-profile/types";
import {
  formatPublishErrors,
  hasPublishErrors,
  validateClubProfilePublish,
} from "@/lib/club-profile/validation";
import { validateClubProfileInput } from "@/lib/club-profile/storage";

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

    const providerId = await resolveProviderIdForAuthUser(supabase, user.id);
    if (!providerId) {
      return NextResponse.json(
        { error: "No club account found for this user." },
        { status: 404 },
      );
    }

    const profile = await fetchClubProfileForProvider(supabase, providerId);
    if (!profile) {
      return NextResponse.json(
        { error: "Club profile not found." },
        { status: 404 },
      );
    }

    console.info("[club-profile] GET visibility:", {
      visibility: profile.visibility,
      published: profile.published,
      publicSlug: profile.publicSlug,
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[club-profile] GET failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load club profile.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  let input: ClubProfileInput;
  try {
    input = (await request.json()) as ClubProfileInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validateClubProfileInput(input);
  if (!validation.isValid) {
    return NextResponse.json(
      {
        error: "Fix contact and social link errors before saving.",
        contactErrors: validation.contactErrors,
        socialErrors: validation.socialErrors,
      },
      { status: 400 },
    );
  }

  const publishErrors = validateClubProfilePublish(input);
  if (hasPublishErrors(publishErrors)) {
    return NextResponse.json(
      {
        error: formatPublishErrors(publishErrors),
        publishErrors,
      },
      { status: 400 },
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

    const result = await saveClubProfileForProvider(supabase, providerId, input);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.code === "slug_taken" ? 409 : 500 },
      );
    }

    return NextResponse.json({ profile: result.profile });
  } catch (error) {
    console.error("[club-profile] PUT failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save club profile.",
      },
      { status: 500 },
    );
  }
}
