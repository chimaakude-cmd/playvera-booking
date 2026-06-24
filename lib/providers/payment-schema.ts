import type { PostgrestError } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { ActivoraSupabaseClient } from "@/lib/supabase";
import type { PayoutSchedule } from "@/lib/payments/club-payment-status";

export type ProviderPaymentModel = "platform_managed" | "club_oauth";

export const CLUB_OAUTH_PAYMENT_DEFAULTS = {
  payment_model: "club_oauth",
  payments_enabled: true,
  payments_paused: false,
  payout_schedule: "weekly",
} as const;

export const PROVIDER_PAYMENT_STATUS_SELECT =
  "payments_enabled, payments_paused, payout_schedule, platform_fee_override_percent, platform_fee_percent, account_status, payment_model, payment_internal_notes, gocardless_status, gocardless_merchant_id, stripe_account_id, stripe_connect_status, stripe_payouts_enabled, stripe_charges_enabled, preferred_payment_provider";

export const PROVIDER_PAYMENT_STATUS_FALLBACK_SELECT =
  "platform_fee_percent, account_status";

export const PROVIDER_STRIPE_ACCOUNT_SELECT = "stripe_account_id";

export const PROVIDER_STRIPE_CONNECT_UPDATE_SELECT =
  "stripe_account_id, stripe_connect_status, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted, stripe_disabled_reason, stripe_requirements_due, stripe_connected_at, stripe_onboarding_complete";

export type ProviderPaymentStatusRow = {
  payments_enabled?: boolean | null;
  payments_paused?: boolean | null;
  payout_schedule?: string | null;
  platform_fee_override_percent?: number | null;
  platform_fee_percent?: number | null;
  account_status?: string | null;
  payment_model?: string | null;
  payment_internal_notes?: string | null;
  gocardless_status?: string | null;
  gocardless_merchant_id?: string | null;
  stripe_account_id?: string | null;
  stripe_connect_status?: string | null;
  stripe_payouts_enabled?: boolean | null;
  stripe_charges_enabled?: boolean | null;
  preferred_payment_provider?: string | null;
};

export function isMissingColumnError(
  error: Pick<PostgrestError, "code" | "message"> | null | undefined,
): boolean {
  if (!error) {
    return false;
  }

  if (error.code === "PGRST204" || error.code === "42703") {
    return true;
  }

  return /column .+ does not exist/i.test(error.message ?? "");
}

export type NormalizedProviderPaymentStatusRow = {
  payments_enabled: boolean;
  payments_paused: boolean;
  payout_schedule: string;
  platform_fee_override_percent: number | null;
  platform_fee_percent: number | null;
  account_status: string;
  payment_model: string;
};

export function normalizeProviderPaymentStatusRow(
  row: ProviderPaymentStatusRow | null,
): NormalizedProviderPaymentStatusRow {
  return {
    payments_enabled: row?.payments_enabled !== false,
    payments_paused: Boolean(row?.payments_paused),
    payout_schedule: row?.payout_schedule ?? "weekly",
    platform_fee_override_percent: row?.platform_fee_override_percent ?? null,
    platform_fee_percent: row?.platform_fee_percent ?? null,
    account_status: row?.account_status ?? "active",
    payment_model: row?.payment_model ?? CLUB_OAUTH_PAYMENT_DEFAULTS.payment_model,
  };
}

export async function fetchProviderPaymentStatusRow(
  supabase: ActivoraSupabaseClient,
  providerId: string,
): Promise<ProviderPaymentStatusRow | null> {
  const full = await supabase
    .from("providers")
    .select(PROVIDER_PAYMENT_STATUS_SELECT)
    .eq("id", providerId)
    .maybeSingle();

  if (!full.error) {
    return (full.data ?? null) as ProviderPaymentStatusRow | null;
  }

  if (!isMissingColumnError(full.error)) {
    throw full.error;
  }

  const fallback = await supabase
    .from("providers")
    .select(PROVIDER_PAYMENT_STATUS_FALLBACK_SELECT)
    .eq("id", providerId)
    .maybeSingle();

  if (fallback.error) {
    throw fallback.error;
  }

  return normalizeProviderPaymentStatusRow(
    (fallback.data ?? null) as ProviderPaymentStatusRow | null,
  );
}

export async function fetchProviderStripeAccountId(
  supabase: ActivoraSupabaseClient,
  providerId: string,
): Promise<string | null> {
  const full = await supabase
    .from("providers")
    .select(PROVIDER_STRIPE_ACCOUNT_SELECT)
    .eq("id", providerId)
    .maybeSingle();

  if (!full.error) {
    return full.data?.stripe_account_id?.trim() || null;
  }

  if (isMissingColumnError(full.error)) {
    return null;
  }

  throw full.error;
}

export type ProviderStripeConnectUpdate = {
  stripe_account_id: string;
  stripe_connect_status: string;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_details_submitted: boolean;
  stripe_disabled_reason: string | null;
  stripe_requirements_due: string[];
  stripe_connected_at?: string;
  stripe_onboarding_complete?: boolean;
  updated_at: string;
};

export async function updateProviderStripeConnectWithFallback(
  supabase: ActivoraSupabaseClient,
  providerId: string,
  update: ProviderStripeConnectUpdate,
): Promise<{ error: PostgrestError | null }> {
  const full = await supabase
    .from("providers")
    .update(update)
    .eq("id", providerId);

  if (!full.error) {
    return { error: null };
  }

  if (!isMissingColumnError(full.error)) {
    return { error: full.error };
  }

  const minimal = await supabase
    .from("providers")
    .update({
      stripe_account_id: update.stripe_account_id,
      updated_at: update.updated_at,
    })
    .eq("id", providerId);

  return { error: minimal.error };
}

export async function insertProviderRowWithPaymentFallback(
  supabase: ActivoraSupabaseClient,
  payload: Database["public"]["Tables"]["providers"]["Insert"],
): Promise<{ data: { id: string } | null; error: PostgrestError | null }> {
  const full = await supabase
    .from("providers")
    .insert(payload)
    .select("id")
    .single();

  if (!full.error && full.data?.id) {
    return { data: { id: full.data.id }, error: null };
  }

  if (!isMissingColumnError(full.error)) {
    return { data: null, error: full.error };
  }

  const {
    payment_model: _paymentModel,
    payments_enabled: _paymentsEnabled,
    payments_paused: _paymentsPaused,
    payout_schedule: _payoutSchedule,
    ...basePayload
  } = payload;

  const retry = await supabase
    .from("providers")
    .insert(basePayload as Database["public"]["Tables"]["providers"]["Insert"])
    .select("id")
    .single();

  return {
    data: retry.data?.id ? { id: retry.data.id } : null,
    error: retry.error,
  };
}

export function resolveProviderPaymentModel(
  value: string | null | undefined,
): ProviderPaymentModel {
  return value === "platform_managed" ? "platform_managed" : "club_oauth";
}

export function normalizePayoutSchedule(
  value: string | null | undefined,
): PayoutSchedule {
  if (value === "daily" || value === "monthly") {
    return value;
  }

  return "weekly";
}

/** Resolve Stripe Connect status when stripe_connect_status may be absent (legacy prod). */
export function resolveStripeConnectStatus(row: {
  stripe_account_id?: string | null;
  stripe_connect_status?: string | null;
  stripe_payouts_enabled?: boolean | null;
  stripe_charges_enabled?: boolean | null;
} | null | undefined): string {
  const status = row?.stripe_connect_status?.trim();
  if (
    status &&
    status !== "not_connected" &&
    status !== "disconnected"
  ) {
    return status;
  }

  if (row?.stripe_payouts_enabled) {
    return "payouts_enabled";
  }

  if (row?.stripe_charges_enabled) {
    return "connected";
  }

  if (row?.stripe_account_id?.trim()) {
    return "action_required";
  }

  return "not_connected";
}

export function isGoCardlessProviderConnected(
  row: Pick<
    ProviderPaymentStatusRow,
    "gocardless_status" | "gocardless_merchant_id"
  > | null | undefined,
): boolean {
  return (
    row?.gocardless_status === "connected" &&
    Boolean(row.gocardless_merchant_id?.trim())
  );
}

export function isStripeProviderConnectedFromRow(
  row: Pick<
    ProviderPaymentStatusRow,
    | "stripe_account_id"
    | "stripe_connect_status"
    | "stripe_payouts_enabled"
    | "stripe_charges_enabled"
  > | null | undefined,
): boolean {
  const status = resolveStripeConnectStatus(row);
  return status === "connected" || status === "payouts_enabled";
}

export function hasAnyPaymentProviderConnected(
  row: ProviderPaymentStatusRow | null | undefined,
): boolean {
  return (
    isGoCardlessProviderConnected(row) || isStripeProviderConnectedFromRow(row)
  );
}
