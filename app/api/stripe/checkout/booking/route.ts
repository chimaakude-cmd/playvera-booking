import { NextResponse } from "next/server";
import { buildPendingBookingPayload } from "@/lib/booking-checkout/build-payload";
import {
  createPendingBooking,
  linkStripeCheckoutSession,
} from "@/lib/booking-checkout/server-store";
import type { BookingDetailsForm } from "@/lib/booking-flow/types";
import type { BookingQuestionConfig } from "@/lib/booking-questions";
import { calculatePaymentBreakdown, type FeeHandling } from "@/lib/payments";
import { calculateVatBreakdown } from "@/lib/club-finance/vat";
import {
  buildStoredCheckoutFeeBreakdown,
  loadSessionCheckoutContext,
  resolveProviderPlatformFee,
} from "@/lib/stripe/platform-fee";
import { getAppBaseUrl, getStripe, isStripeConfigured } from "@/lib/stripe/server";
import { createSupabaseServiceRoleClient, isSupabaseConfigured } from "@/lib/supabase";

type CheckoutBody = {
  session: {
    id: string;
    sessionTitle: string;
    location: string;
    day: string;
    startTime: string;
    endTime: string;
    price: number;
    platformFeePercent?: number;
    providerStripeAccountId?: string;
    providerId?: string;
  };
  details: BookingDetailsForm;
  sessionQuestions: BookingQuestionConfig[];
  questionValues: Record<string, string | boolean>;
  accessMode: "guest" | "parent";
  feeHandling?: FeeHandling;
};

function resolveListPrice(
  checkoutContext: Awaited<ReturnType<typeof loadSessionCheckoutContext>>,
  bodyPrice: number,
): number {
  if (checkoutContext && checkoutContext.listPrice > 0) {
    return checkoutContext.listPrice;
  }
  return bodyPrice;
}

export async function POST(request: Request) {
  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.session?.id || !body.details?.email) {
    return NextResponse.json(
      { error: "Session and parent email are required." },
      { status: 400 },
    );
  }

  const checkoutContext = await loadSessionCheckoutContext(body.session.id);

  let platformFeePercent: number;
  let platformFeeSource: string;
  let feeHandling: FeeHandling;
  let connectedAccountId: string | null | undefined;

  if (checkoutContext) {
    platformFeePercent = checkoutContext.platformFee.platformFeePercent;
    platformFeeSource = checkoutContext.platformFee.source;
    feeHandling = checkoutContext.feeHandling;
    connectedAccountId = checkoutContext.stripeAccountId;
  } else if (body.session.providerId && isSupabaseConfigured()) {
    const resolved = await resolveProviderPlatformFee(body.session.providerId);
    platformFeePercent = resolved.platformFeePercent;
    platformFeeSource = resolved.source;
    feeHandling = body.feeHandling ?? "provider_absorbs";
    connectedAccountId = body.session.providerStripeAccountId?.trim() || null;
  } else {
    platformFeePercent = body.session.platformFeePercent ?? 2.5;
    platformFeeSource = "client_fallback";
    feeHandling = body.feeHandling ?? "provider_absorbs";
    connectedAccountId = body.session.providerStripeAccountId?.trim() || null;
  }

  const listPrice = resolveListPrice(checkoutContext, body.session.price);
  const vatBreakdown = calculateVatBreakdown(listPrice);
  const payment = calculatePaymentBreakdown(
    vatBreakdown.grossAmount,
    platformFeePercent,
    feeHandling,
  );

  const feeBreakdown = buildStoredCheckoutFeeBreakdown({
    listPrice: vatBreakdown.grossAmount,
    customerPrice: payment.customerPrice,
    platformFeePercent,
    platformFeeSource: platformFeeSource as "override" | "plan" | "provider" | "platform_config",
    feeHandling,
    estimatedStripeFee: payment.estimatedStripeFee,
    estimatedProviderPayout: payment.estimatedProviderPayout,
  });

  const payload = buildPendingBookingPayload({
    session: {
      id: body.session.id,
      sessionTitle: body.session.sessionTitle,
      activityType: "",
      location: body.session.location,
      day: body.session.day,
      startTime: body.session.startTime,
      endTime: body.session.endTime,
      price: listPrice,
      capacity: 0,
      ageRange: "",
      providerStripeAccountId: connectedAccountId ?? "",
      platformFeePercent,
      bookings: 0,
      createdAt: new Date().toISOString(),
    },
    details: body.details,
    sessionQuestions: body.sessionQuestions ?? [],
    questionValues: body.questionValues ?? {},
    pricePaid: payment.customerPrice,
    accessMode: body.accessMode,
    feeBreakdown,
  });

  const pending = createPendingBooking(payload);
  const baseUrl = getAppBaseUrl(request);
  const amountPence = Math.round(payment.customerPrice * 100);
  const platformFeePence = feeBreakdown.applicationFeePence;

  if (!isStripeConfigured() || amountPence <= 0) {
    return NextResponse.json({
      mock: true,
      pendingBookingId: pending.id,
      amount: payment.customerPrice,
      feeBreakdown,
    });
  }

  const stripe = await getStripe();

  if (!connectedAccountId && checkoutContext?.providerId && isSupabaseConfigured()) {
    const supabase = createSupabaseServiceRoleClient();
    const { data: providerRow } = await supabase
      .from("providers")
      .select("stripe_account_id")
      .eq("id", checkoutContext.providerId)
      .maybeSingle();
    connectedAccountId = providerRow?.stripe_account_id?.trim() || null;
  }

  const successUrl = `${baseUrl}/book/confirmation?checkout=success&pending_id=${pending.id}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/book/${body.session.id}?checkout=cancelled`;

  const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    mode: "payment",
    customer_email: body.details.email.trim(),
    line_items: [
      {
        price_data: {
          currency: "gbp",
          unit_amount: amountPence,
          product_data: {
            name: body.session.sessionTitle,
            description: `${body.session.day} · ${body.session.startTime}`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      pendingBookingId: pending.id,
      sessionId: body.session.id,
      childName: body.details.childName,
      platformFeePercent: String(platformFeePercent),
      applicationFeePence: String(platformFeePence),
      platformFeeSource,
    },
  };

  if (connectedAccountId) {
    sessionParams.payment_intent_data = {
      application_fee_amount: platformFeePence,
      transfer_data: { destination: connectedAccountId },
      metadata: {
        pendingBookingId: pending.id,
        platformFeePercent: String(platformFeePercent),
        applicationFeePence: String(platformFeePence),
      },
    };
  }

  const checkoutSession = await stripe.checkout.sessions.create(sessionParams);
  linkStripeCheckoutSession(pending.id, checkoutSession.id);

  return NextResponse.json({
    checkoutUrl: checkoutSession.url,
    pendingBookingId: pending.id,
    sessionId: checkoutSession.id,
    feeBreakdown,
  });
}
