import { NextRequest, NextResponse } from "next/server";
import {
  submitClubOnboardingToSupabase,
  type ClubOnboardingSubmitInput,
} from "@/lib/club-onboarding/submit";
import { normalizePlanId } from "@/src/config/pricing";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<ClubOnboardingSubmitInput>;

    if (!body.owner?.email?.trim()) {
      return NextResponse.json(
        { error: "Owner email is required." },
        { status: 400 },
      );
    }

    if (!body.owner.password?.trim()) {
      return NextResponse.json(
        { error: "Password is required." },
        { status: 400 },
      );
    }

    if (!body.club?.name?.trim()) {
      return NextResponse.json(
        { error: "Club name is required." },
        { status: 400 },
      );
    }

    const input: ClubOnboardingSubmitInput = {
      owner: body.owner,
      club: body.club,
      profile: body.profile ?? {
        logoUrl: null,
        coverUrl: null,
        primaryColor: "#0d9488",
        tagline: "",
        aboutText: "",
        skippedProfile: false,
      },
      planId: normalizePlanId(body.planId),
    };

    console.info("[club-onboarding] Received onboarding submit request:", {
      email: input.owner.email.trim().toLowerCase(),
      clubName: input.club.name.trim(),
      planId: input.planId,
    });

    const result = await submitClubOnboardingToSupabase(input);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      {
        providerId: result.providerId,
        authUserId: result.authUserId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[club-onboarding] Unhandled onboarding submit error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to complete club onboarding.",
      },
      { status: 500 },
    );
  }
}
