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
} from "@/lib/payments/club-payment-status";
import { fetchClubPaymentMetrics } from "@/lib/payments/payment-events-data";
import {
  fetchProviderPaymentStatusRow,
  isGoCardlessProviderConnected,
  isStripeProviderConnectedFromRow,
  normalizePayoutSchedule,
  normalizeProviderPaymentStatusRow,
  resolveProviderPaymentModel,
} from "@/lib/providers/payment-schema";
import { isPaymentSetupCompleteFromRow } from "@/lib/payment-providers/setup-status";
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
    let providerRow;
    try {
      providerRow = await fetchProviderPaymentStatusRow(service, providerId);
    } catch (providerError) {
      console.error(
        "[club-payment-status] Provider lookup failed:",
        providerError instanceof Error
          ? providerError.message
          : providerError,
      );
      return NextResponse.json(
        buildMissingProviderPaymentStatusResponse(
          platformConfig.platformFeePercent,
        ),
      );
    }

    if (!providerRow) {
      return NextResponse.json(
        buildMissingProviderPaymentStatusResponse(
          platformConfig.platformFeePercent,
        ),
      );
    }

    const provider = normalizeProviderPaymentStatusRow(providerRow);
    const metrics = await fetchClubPaymentMetrics(providerId);
    const payoutSchedule = normalizePayoutSchedule(provider.payout_schedule);
    const payoutScheduleLabel =
      PAYOUT_SCHEDULE_LABELS[payoutSchedule] ?? PAYOUT_SCHEDULE_LABELS.weekly;

    const status = resolveClubPaymentStatus({
      paymentsEnabled: provider.payments_enabled,
      paymentsPaused: provider.payments_paused,
      accountStatus: String(provider.account_status),
      hasConfirmedPayment: metrics.hasConfirmedPayment,
      hasPendingPayout: metrics.hasPendingPayout,
      platformEnabled: platformConfig.platformEnabled,
      hasPaymentProviderConnected: isPaymentSetupCompleteFromRow(providerRow),
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
      paymentModel: resolveProviderPaymentModel(provider.payment_model),
      stripeOptional: true,
      gocardlessAvailable: platformConfig.clubConnectAvailable,
      gocardlessConnected: isGoCardlessProviderConnected(providerRow),
      stripeConnected: isStripeProviderConnectedFromRow(providerRow),
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
