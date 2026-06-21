import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requirePlatformSettingsWriteActor } from "@/lib/admin-users/api-auth";
import { calculateGoCardlessPayoutBreakdown } from "@/lib/gocardless/fees";
import {
  appendGoCardlessPlatformLog,
  recordGoCardlessPaymentSplit,
  resolveGoCardlessPlatformConfig,
} from "@/lib/gocardless/platform-config";

const TEST_AMOUNT = 1;

export async function POST(request: NextRequest) {
  const auth = await requirePlatformSettingsWriteActor(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const resolved = await resolveGoCardlessPlatformConfig(request);

  if (!resolved.isBillingConfigured) {
    return NextResponse.json(
      { error: "GoCardless access token is required for payment testing." },
      { status: 400 },
    );
  }

  const breakdown = calculateGoCardlessPayoutBreakdown(
    TEST_AMOUNT,
    resolved.platformFeePercent,
  );

  const testBookingId = randomUUID();
  const testProviderId = randomUUID();

  await recordGoCardlessPaymentSplit({
    bookingId: testBookingId,
    providerId: testProviderId,
    grossAmount: breakdown.customerPayment,
    processingFee: breakdown.gocardlessProcessingFee,
    platformFee: breakdown.activoraPlatformFee,
    netAmount: breakdown.providerPayout,
    status: "payment_pending",
    paymentId: `TEST_PM_${Date.now()}`,
  });

  await appendGoCardlessPlatformLog({
    eventType: "test_payment",
    message: `£${TEST_AMOUNT} test payment recorded with fee split.`,
    metadata: {
      adminId: auth.actor.adminId,
      grossAmount: breakdown.customerPayment,
      processingFee: breakdown.gocardlessProcessingFee,
      platformFee: breakdown.activoraPlatformFee,
      netAmount: breakdown.providerPayout,
      testBookingId,
    },
  });

  return NextResponse.json({
    ok: true,
    amount: TEST_AMOUNT,
    split: {
      gross_amount: breakdown.customerPayment,
      processing_fee: breakdown.gocardlessProcessingFee,
      platform_fee: breakdown.activoraPlatformFee,
      net_amount: breakdown.providerPayout,
      platform_fee_percent: breakdown.platformFeePercent,
    },
    message: "Test payment split recorded. Use simulate webhook to confirm payout.",
  });
}
