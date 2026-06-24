import type Stripe from "stripe";
import type {
  ParentSubscriptionRecord,
  ParentSubscriptionStatus,
} from "@/lib/session-subscriptions/types";
import {
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";

type SubscriptionRow = {
  id: string;
  session_id: string;
  ticket_id: string | null;
  booking_id: string | null;
  provider_id: string;
  parent_email: string;
  parent_name: string;
  child_name: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_checkout_session_id: string | null;
  status: ParentSubscriptionStatus;
  monthly_amount: number;
  platform_fee_percent: number;
  current_period_end: string | null;
  canceled_at: string | null;
  last_payment_failed_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: SubscriptionRow): ParentSubscriptionRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    ticketId: row.ticket_id,
    bookingId: row.booking_id,
    providerId: row.provider_id,
    parentEmail: row.parent_email,
    parentName: row.parent_name,
    childName: row.child_name,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    status: row.status,
    monthlyAmount: Number(row.monthly_amount),
    platformFeePercent: Number(row.platform_fee_percent),
    currentPeriodEnd: row.current_period_end,
    canceledAt: row.canceled_at,
    lastPaymentFailedAt: row.last_payment_failed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): ParentSubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    case "unpaid":
      return "unpaid";
    default:
      return "pending";
  }
}

export async function upsertPendingSubscriptionRecord(input: {
  sessionId: string;
  ticketId?: string | null;
  providerId: string;
  parentEmail: string;
  parentName: string;
  childName: string;
  monthlyAmount: number;
  platformFeePercent: number;
  stripeCheckoutSessionId: string;
  pendingBookingId: string;
}): Promise<ParentSubscriptionRecord | null> {
  if (!isSupabaseConfigured() || !isSupabaseServiceRoleConfigured()) {
    return null;
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: existing } = await supabase
    .from("parent_subscription_records")
    .select("*")
    .eq("stripe_checkout_session_id", input.stripeCheckoutSessionId)
    .maybeSingle();

  if (existing) {
    return mapRow(existing as SubscriptionRow);
  }

  const { data, error } = await supabase
    .from("parent_subscription_records")
    .insert({
      session_id: input.sessionId,
      ticket_id: input.ticketId ?? null,
      provider_id: input.providerId,
      parent_email: input.parentEmail,
      parent_name: input.parentName,
      child_name: input.childName,
      monthly_amount: input.monthlyAmount,
      platform_fee_percent: input.platformFeePercent,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[subscription] pending insert failed:", error?.message);
    return null;
  }

  return mapRow(data as SubscriptionRow);
}

export async function syncSubscriptionFromStripe(
  subscription: Stripe.Subscription,
  checkoutSession?: Stripe.Checkout.Session,
): Promise<ParentSubscriptionRecord | null> {
  if (!isSupabaseConfigured() || !isSupabaseServiceRoleConfigured()) {
    return null;
  }

  const supabase = createSupabaseServiceRoleClient();
  const metadata = {
    ...checkoutSession?.metadata,
    ...subscription.metadata,
  };

  const stripeSubscriptionId = subscription.id;
  const stripeCheckoutSessionId =
    typeof subscription.metadata?.stripeCheckoutSessionId === "string"
      ? subscription.metadata.stripeCheckoutSessionId
      : checkoutSession?.id ?? null;

  const { data: existing } = await supabase
    .from("parent_subscription_records")
    .select("*")
    .or(
      `stripe_subscription_id.eq.${stripeSubscriptionId}${
        stripeCheckoutSessionId
          ? `,stripe_checkout_session_id.eq.${stripeCheckoutSessionId}`
          : ""
      }`,
    )
    .maybeSingle();

  const monthlyAmount =
    subscription.items.data[0]?.price?.unit_amount != null
      ? subscription.items.data[0].price.unit_amount / 100
      : Number(metadata.monthlyAmount ?? 0);

  const periodEnd = (subscription as Stripe.Subscription & {
    current_period_end?: number | null;
  }).current_period_end;

  const payload = {
    stripe_subscription_id: stripeSubscriptionId,
    stripe_customer_id:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id ?? null,
    stripe_checkout_session_id: stripeCheckoutSessionId,
    status: mapStripeSubscriptionStatus(subscription.status),
    monthly_amount: monthlyAmount,
    current_period_end: periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : null,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    parent_email:
      metadata.parentEmail ??
      checkoutSession?.customer_email ??
      existing?.parent_email ??
      "",
    parent_name: metadata.parentName ?? existing?.parent_name ?? "",
    child_name: metadata.childName ?? existing?.child_name ?? "",
    session_id: metadata.sessionId ?? existing?.session_id,
    ticket_id: metadata.ticketId || existing?.ticket_id || null,
    provider_id: metadata.providerId ?? existing?.provider_id,
    platform_fee_percent: Number(
      metadata.platformFeePercent ?? existing?.platform_fee_percent ?? 2.5,
    ),
  };

  if (!payload.session_id || !payload.provider_id) {
    console.error("[subscription] missing session/provider metadata");
    return null;
  }

  if (existing) {
    const { data, error } = await supabase
      .from("parent_subscription_records")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error || !data) {
      console.error("[subscription] update failed:", error?.message);
      return null;
    }

    return mapRow(data as SubscriptionRow);
  }

  const { data, error } = await supabase
    .from("parent_subscription_records")
    .insert({
      ...payload,
      parent_email: payload.parent_email || "unknown@activora.local",
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[subscription] insert failed:", error?.message);
    return null;
  }

  return mapRow(data as SubscriptionRow);
}

export async function markSubscriptionPaymentFailed(
  stripeSubscriptionId: string,
): Promise<void> {
  if (!isSupabaseConfigured() || !isSupabaseServiceRoleConfigured()) {
    return;
  }

  const supabase = createSupabaseServiceRoleClient();
  await supabase
    .from("parent_subscription_records")
    .update({
      status: "past_due",
      last_payment_failed_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", stripeSubscriptionId);
}

export async function markSubscriptionInvoicePaid(
  invoice: Stripe.Invoice,
): Promise<void> {
  const subscriptionId = (() => {
    const legacy = (invoice as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null;
    }).subscription;
    if (typeof legacy === "string") {
      return legacy;
    }
    if (legacy && typeof legacy === "object") {
      return legacy.id;
    }
    return null;
  })();

  if (!subscriptionId || !isSupabaseConfigured()) {
    return;
  }

  const supabase = createSupabaseServiceRoleClient();
  await supabase
    .from("parent_subscription_records")
    .update({
      status: "active",
      last_payment_failed_at: null,
    })
    .eq("stripe_subscription_id", subscriptionId);
}

export async function getSessionSubscriptionStats(
  sessionId: string,
): Promise<{
  activeSubscribers: number;
  trialingSubscribers: number;
  failedPayments: number;
  estimatedMrr: number;
  records: ParentSubscriptionRecord[];
}> {
  if (!isSupabaseConfigured() || !isSupabaseServiceRoleConfigured()) {
    return {
      activeSubscribers: 0,
      trialingSubscribers: 0,
      failedPayments: 0,
      estimatedMrr: 0,
      records: [],
    };
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("parent_subscription_records")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return {
      activeSubscribers: 0,
      trialingSubscribers: 0,
      failedPayments: 0,
      estimatedMrr: 0,
      records: [],
    };
  }

  const records = (data as SubscriptionRow[]).map(mapRow);
  const activeSubscribers = records.filter(
    (record) => record.status === "active",
  ).length;
  const trialingSubscribers = records.filter(
    (record) => record.status === "trialing",
  ).length;
  const failedPayments = records.filter(
    (record) =>
      record.status === "past_due" ||
      record.status === "unpaid" ||
      record.lastPaymentFailedAt != null,
  ).length;
  const estimatedMrr = records
    .filter(
      (record) => record.status === "active" || record.status === "trialing",
    )
    .reduce((total, record) => total + record.monthlyAmount, 0);

  return {
    activeSubscribers,
    trialingSubscribers,
    failedPayments,
    estimatedMrr,
    records,
  };
}

export async function cancelParentSubscription(
  recordId: string,
  stripe: Stripe,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !isSupabaseServiceRoleConfigured()) {
    return { ok: false, error: "Database not configured." };
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: row, error } = await supabase
    .from("parent_subscription_records")
    .select("*")
    .eq("id", recordId)
    .maybeSingle();

  if (error || !row?.stripe_subscription_id) {
    return { ok: false, error: "Subscription not found." };
  }

  await stripe.subscriptions.cancel(String(row.stripe_subscription_id));

  await supabase
    .from("parent_subscription_records")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
    })
    .eq("id", recordId);

  return { ok: true };
}
