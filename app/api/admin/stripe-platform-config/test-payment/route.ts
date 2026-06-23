import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requirePlatformSettingsWriteActor } from "@/lib/admin-users/api-auth";
import { calculateStripeConnectPayoutBreakdown } from "@/lib/payments";
import {
  appendStripePlatformLog,
  resolveStripePlatformConfig,
} from "@/lib/stripe/platform-admin";

const TEST_AMOUNT = 1;

export async function POST(request: NextRequest) {
  const auth = await requirePlatformSettingsWriteActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const resolved = await resolveStripePlatformConfig(request);

  if (!resolved.isPlatformConfigured) {
    return NextResponse.json(
      { error: "Stripe API keys are required for payment testing." },
      { status: 400 },
    );
  }

  const breakdown = calculateStripeConnectPayoutBreakdown(
    TEST_AMOUNT,
    resolved.platformFeePercent,
  );

  const testBookingId = randomUUID();
  const testProviderId = randomUUID();

  await appendStripePlatformLog({
    eventType: "test_payment",
    message: `£${TEST_AMOUNT} test payment recorded with fee split.`,
    metadata: {
      adminId: auth.actor.adminId,
      grossAmount: breakdown.customerPayment,
      processingFee: breakdown.stripeProcessingFee,
      platformFee: breakdown.activoraPlatformFee,
      netAmount: breakdown.providerPayout,
      testBookingId,
      testProviderId,
      environment: resolved.environment,
    },
  });

  return NextResponse.json({
    ok: true,
    amount: TEST_AMOUNT,
    split: {
      gross_amount: breakdown.customerPayment,
      processing_fee: breakdown.stripeProcessingFee,
      platform_fee: breakdown.activoraPlatformFee,
      net_amount: breakdown.providerPayout,
      platform_fee_percent: breakdown.platformFeePercent,
    },
    message:
      "Test payment split recorded. Use simulate webhook to confirm checkout flow.",
  });
}
