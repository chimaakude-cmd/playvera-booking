import type { FeeHandling } from "@/lib/fee-settings";
import { calculatePlatformFeeAmount } from "@/lib/fee-settings";
import { resolveEffectivePlatformFeePercent } from "@/lib/payments/club-payment-status";
import {
  fetchProviderStripeAccountId,
} from "@/lib/providers/payment-schema";
import { getServerBookingFeeForPlan } from "@/lib/subscription-plans/server-store";
import { legacyIdToPlanSlug } from "@/lib/subscription-plans/defaults";
import { getStripePlatformFeePercent } from "@/lib/stripe/platform-admin/resolve";
import {
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";

export type PlatformFeeSource =
  | "override"
  | "plan"
  | "provider"
  | "platform_config";

export type ResolvedPlatformFee = {
  platformFeePercent: number;
  source: PlatformFeeSource;
};

export type SessionCheckoutContext = {
  sessionId: string;
  providerId: string;
  listPrice: number;
  stripeAccountId: string | null;
  platformFee: ResolvedPlatformFee;
  feeHandling: FeeHandling;
  isSubscription: boolean;
  stripeProductId: string | null;
  stripePriceId: string | null;
  ticketId: string | null;
};

type ProviderFeeRow = {
  platform_fee_override_percent: number | null;
  platform_fee_percent: number | null;
  fee_handling: FeeHandling | null;
};

function normalizeFeeHandling(value: string | null | undefined): FeeHandling {
  if (value === "fees_on_top" || value === "split_fee") {
    return value;
  }
  return "provider_absorbs";
}

export function resolvePlatformFeePercentFromInputs(input: {
  overridePercent: number | null | undefined;
  planBookingFeePercent: number | null | undefined;
  providerPlatformFeePercent: number | null | undefined;
  platformConfigPercent: number;
}): ResolvedPlatformFee {
  const override = input.overridePercent;
  if (
    override !== null &&
    override !== undefined &&
    Number.isFinite(Number(override))
  ) {
    return {
      platformFeePercent: Number(override),
      source: "override",
    };
  }

  const planFee = input.planBookingFeePercent;
  if (planFee !== null && planFee !== undefined && Number.isFinite(Number(planFee))) {
    return {
      platformFeePercent: Number(planFee),
      source: "plan",
    };
  }

  const providerFee = resolveEffectivePlatformFeePercent(
    null,
    Number(input.providerPlatformFeePercent ?? NaN),
  );
  if (Number.isFinite(providerFee) && providerFee > 0) {
    return {
      platformFeePercent: providerFee,
      source: "provider",
    };
  }

  return {
    platformFeePercent: input.platformConfigPercent,
    source: "platform_config",
  };
}

export async function resolveProviderPlatformFee(
  providerId: string,
): Promise<ResolvedPlatformFee> {
  const platformConfigPercent = await getStripePlatformFeePercent();

  if (!isSupabaseConfigured() || !isSupabaseServiceRoleConfigured()) {
    return {
      platformFeePercent: platformConfigPercent,
      source: "platform_config",
    };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: providerRow } = await supabase
    .from("providers")
    .select("platform_fee_override_percent, platform_fee_percent")
    .eq("id", providerId)
    .maybeSingle();

  const { data: subscriptionRow } = await supabase
    .from("provider_subscriptions")
    .select("plan")
    .eq("provider_id", providerId)
    .maybeSingle();

  let planBookingFeePercent: number | null = null;
  if (subscriptionRow?.plan) {
    planBookingFeePercent = await getServerBookingFeeForPlan(
      legacyIdToPlanSlug(subscriptionRow.plan),
    );
  }

  return resolvePlatformFeePercentFromInputs({
    overridePercent: providerRow?.platform_fee_override_percent ?? null,
    planBookingFeePercent,
    providerPlatformFeePercent: providerRow?.platform_fee_percent ?? null,
    platformConfigPercent: platformConfigPercent,
  });
}

export async function loadSessionCheckoutContext(
  sessionId: string,
): Promise<SessionCheckoutContext | null> {
  if (!isSupabaseConfigured() || !isSupabaseServiceRoleConfigured()) {
    return null;
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: sessionRow, error: sessionError } = await supabase
    .from("sessions")
    .select(
      "id, provider_id, price, booking_type, subscription_enabled, payment_type, stripe_product_id, stripe_price_id",
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError || !sessionRow?.provider_id) {
    return null;
  }

  const providerId = String(sessionRow.provider_id);
  const listPrice = Number(sessionRow.price);

  const { data: subscriptionTicket } = await supabase
    .from("tickets")
    .select("id, price, ticket_type")
    .eq("session_id", sessionId)
    .in("ticket_type", ["subscription", "subscription_placeholder"])
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  const isSubscription =
    sessionRow.booking_type === "subscription" ||
    sessionRow.subscription_enabled === true ||
    sessionRow.payment_type === "monthly_subscription" ||
    subscriptionTicket != null;

  const resolvedListPrice =
    isSubscription && subscriptionTicket?.price
      ? Number(subscriptionTicket.price)
      : listPrice;

  const [platformFee, stripeAccountId] = await Promise.all([
    resolveProviderPlatformFee(providerId),
    fetchProviderStripeAccountId(supabase, providerId),
  ]);

  let feeHandling: FeeHandling = "provider_absorbs";
  const { data: providerFeeRow } = await supabase
    .from("providers")
    .select("fee_handling")
    .eq("id", providerId)
    .maybeSingle();

  if (providerFeeRow) {
    feeHandling = normalizeFeeHandling(
      (providerFeeRow as ProviderFeeRow).fee_handling,
    );
  }

  return {
    sessionId,
    providerId,
    listPrice: Number.isFinite(resolvedListPrice) ? resolvedListPrice : 0,
    stripeAccountId,
    platformFee,
    feeHandling,
    isSubscription,
    stripeProductId: sessionRow.stripe_product_id ?? null,
    stripePriceId: sessionRow.stripe_price_id ?? null,
    ticketId: subscriptionTicket?.id ?? null,
  };
}

/** Activora fee retained via Stripe Connect `application_fee_amount` (always on list price). */
export function calculateApplicationFeePence(
  listPrice: number,
  platformFeePercent: number,
): number {
  const feePounds = calculatePlatformFeeAmount(listPrice, platformFeePercent);
  return Math.max(0, Math.round(feePounds * 100));
}

export type StoredCheckoutFeeBreakdown = {
  listPrice: number;
  customerPrice: number;
  platformFeePercent: number;
  platformFee: number;
  applicationFeePence: number;
  platformFeeSource: PlatformFeeSource;
  estimatedStripeFee: number;
  estimatedProviderPayout: number;
  feeHandling: FeeHandling;
};

export function buildStoredCheckoutFeeBreakdown(params: {
  listPrice: number;
  customerPrice: number;
  platformFeePercent: number;
  platformFeeSource: PlatformFeeSource;
  feeHandling: FeeHandling;
  estimatedStripeFee: number;
  estimatedProviderPayout: number;
}): StoredCheckoutFeeBreakdown {
  const platformFee = calculatePlatformFeeAmount(
    params.listPrice,
    params.platformFeePercent,
  );

  return {
    listPrice: params.listPrice,
    customerPrice: params.customerPrice,
    platformFeePercent: params.platformFeePercent,
    platformFee,
    applicationFeePence: calculateApplicationFeePence(
      params.listPrice,
      params.platformFeePercent,
    ),
    platformFeeSource: params.platformFeeSource,
    estimatedStripeFee: params.estimatedStripeFee,
    estimatedProviderPayout: params.estimatedProviderPayout,
    feeHandling: params.feeHandling,
  };
}
