import { NextResponse } from "next/server";
import { resolveProviderIdForAuthUser } from "@/lib/club-profile/server";
import {
  DEFAULT_GOCARDLESS_PLATFORM_CONFIG,
} from "@/lib/gocardless/platform-config/defaults";
import {
  resolveGoCardlessPlatformConfig,
} from "@/lib/gocardless/platform-config";
import {
  buildMissingProviderPaymentStatusResponse,
  estimateNextPayoutDate,
  formatPayoutDate,
  PAYOUT_SCHEDULE_LABELS,
  resolveClubPaymentStatus,
  resolveEffectivePlatformFeePercent,
  type PayoutSchedule,
} from "@/lib/payments/club-payment-status";
import { fetchClubPaymentMetrics } from "@/lib/payments/payment-events-data";
import { createSupabaseCookieClient } from "@/lib/supabase-ssr";
import {
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
} from "@/lib/supabase";

async function loadPlatformConfig() {
  try {
    const resolved = await resolveGoCardlessPlatformConfig();
    return {
      platformEnabled: resolved.platformEnabled,
      platformFeePercent: resolved.platformFeePercent,
      clubConnectAvailable: resolved.isClubConnectAvailable,
    };
  } catch (error) {
    console.error("[club-payment-status] Platform config unavailable:", error);
    return {
      platformEnabled: DEFAULT_GOCARDLESS_PLATFORM_CONFIG.platformEnabled,
      platformFeePercent: DEFAULT_GOCARDLESS_PLATFORM_CONFIG.platformFeePercent,
      clubConnectAvailable: false,
    };
  }
}

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
    const platformConfig = await loadPlatformConfig();

    if (!providerId) {
      return NextResponse.json(
        buildMissingProviderPaymentStatusResponse(
          platformConfig.platformFeePercent,
        ),
      );
    }

    const service = createSupabaseServiceRoleClient();
    const { data: provider, error: providerError } = await service
      .from("providers")
      .select(
        "payments_enabled, payments_paused, payout_schedule, platform_fee_override_percent, platform_fee_percent, account_status, payment_model",
      )
      .eq("id", providerId)
      .maybeSingle();

    if (providerError) {
      console.error(
        "[club-payment-status] Provider lookup failed:",
        providerError.message,
      );
      return NextResponse.json(
        buildMissingProviderPaymentStatusResponse(
          platformConfig.platformFeePercent,
        ),
      );
    }

    if (!provider) {
      return NextResponse.json(
        buildMissingProviderPaymentStatusResponse(
          platformConfig.platformFeePercent,
        ),
      );
    }

    const metrics = await fetchClubPaymentMetrics(providerId);
    const payoutSchedule = (provider.payout_schedule ?? "weekly") as PayoutSchedule;
    const payoutScheduleLabel =
      PAYOUT_SCHEDULE_LABELS[payoutSchedule] ?? PAYOUT_SCHEDULE_LABELS.weekly;

    const status = resolveClubPaymentStatus({
      paymentsEnabled: provider.payments_enabled !== false,
      paymentsPaused: Boolean(provider.payments_paused),
      accountStatus: String(provider.account_status ?? "active"),
      hasConfirmedPayment: metrics.hasConfirmedPayment,
      hasPendingPayout: metrics.hasPendingPayout,
      platformEnabled: platformConfig.platformEnabled,
    });

    const platformFeePercent = resolveEffectivePlatformFeePercent(
      provider.platform_fee_override_percent !== null &&
        provider.platform_fee_override_percent !== undefined
        ? Number(provider.platform_fee_override_percent)
        : null,
      Number(
        provider.platform_fee_percent ?? platformConfig.platformFeePercent,
      ),
    );

    const nextPayout = estimateNextPayoutDate(payoutSchedule);

    return NextResponse.json({
      provider: "GoCardless",
      paymentModel: provider.payment_model ?? "club_oauth",
      stripeOptional: true,
      gocardlessAvailable: platformConfig.clubConnectAvailable,
      status,
      payoutSchedule,
      payoutScheduleLabel,
      estimatedNextPayout: formatPayoutDate(nextPayout.toISOString()),
      platformFeePercent,
    });
  } catch (error) {
    console.error("[club-payment-status] GET failed:", error);
    return NextResponse.json(
      buildMissingProviderPaymentStatusResponse(
        DEFAULT_GOCARDLESS_PLATFORM_CONFIG.platformFeePercent,
      ),
    );
  }
}
