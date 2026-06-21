import { NextResponse } from "next/server";
import { computeRollingTwelveMonthTaxableVolume } from "@/lib/club-finance/rolling-revenue";
import {
  getVatThresholdStatus,
  shouldShowVatSetupTask,
} from "@/lib/club-finance/vat-threshold";
import { resolveProviderIdForAuthUser } from "@/lib/club-profile/server";
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

    const providerId = await resolveProviderIdForAuthUser(supabase, user.id);
    if (!providerId) {
      return NextResponse.json(
        { error: "No club account found for this user." },
        { status: 404 },
      );
    }

    const rollingTwelveMonthRevenue = await computeRollingTwelveMonthTaxableVolume(
      supabase,
      providerId,
    );

    return NextResponse.json({
      rollingTwelveMonthRevenue,
      thresholdStatus: getVatThresholdStatus(rollingTwelveMonthRevenue),
      showVatSetupTask: shouldShowVatSetupTask(rollingTwelveMonthRevenue),
    });
  } catch (error) {
    console.error("[club-vat-threshold] GET failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load VAT threshold data.",
      },
      { status: 500 },
    );
  }
}
