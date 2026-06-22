import type { PostgrestError } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/database.types";
import {
  fetchProviderPaymentStatusRow,
  isMissingColumnError,
  normalizeProviderPaymentStatusRow,
  normalizePayoutSchedule,
  resolveProviderPaymentModel,
} from "@/lib/providers/payment-schema";
import {
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
} from "@/lib/supabase";
import type { PayoutSchedule } from "@/lib/payments/club-payment-status";

export type ProviderPaymentControls = {
  paymentsEnabled: boolean;
  paymentsPaused: boolean;
  payoutSchedule: PayoutSchedule;
  platformFeeOverridePercent: number | null;
  paymentInternalNotes: string;
  paymentModel: "platform_managed" | "club_oauth";
};

export type ProviderPaymentAuditEntry = {
  id: string;
  action: string;
  previousValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  note: string | null;
  adminUserId: string | null;
  createdAt: string;
};

export type ProviderPaymentControlsUpdate = Partial<{
  paymentsEnabled: boolean;
  paymentsPaused: boolean;
  payoutSchedule: PayoutSchedule;
  platformFeeOverridePercent: number | null;
  paymentInternalNotes: string;
}>;

type ProviderPaymentRow = {
  payments_enabled?: boolean | null;
  payments_paused?: boolean | null;
  payout_schedule?: string | null;
  platform_fee_override_percent?: number | null;
  payment_internal_notes?: string | null;
  payment_model?: string | null;
};

function normalizePayoutScheduleLocal(
  value: string | null | undefined,
): PayoutSchedule {
  if (value === "daily" || value === "monthly") {
    return value;
  }
  return "weekly";
}

export function mapProviderPaymentControls(
  row: ProviderPaymentRow,
): ProviderPaymentControls {
  return {
    paymentsEnabled: row.payments_enabled !== false,
    paymentsPaused: Boolean(row.payments_paused),
    payoutSchedule: normalizePayoutScheduleLocal(row.payout_schedule),
    platformFeeOverridePercent:
      row.platform_fee_override_percent !== null &&
      row.platform_fee_override_percent !== undefined
        ? Number(row.platform_fee_override_percent)
        : null,
    paymentInternalNotes: row.payment_internal_notes?.trim() ?? "",
    paymentModel:
      row.payment_model === "club_oauth" ? "club_oauth" : "platform_managed",
  };
}

export async function fetchProviderPaymentControls(
  providerId: string,
): Promise<ProviderPaymentControls | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = createSupabaseServiceRoleClient();
  let row;
  try {
    row = await fetchProviderPaymentStatusRow(supabase, providerId);
  } catch (error) {
    if (
      isMissingColumnError(
        error as Pick<PostgrestError, "code" | "message"> | null,
      )
    ) {
      return mapProviderPaymentControls({});
    }
    return null;
  }

  if (!row) {
    return null;
  }

  const normalized = normalizeProviderPaymentStatusRow(row);
  return {
    paymentsEnabled: normalized.payments_enabled,
    paymentsPaused: normalized.payments_paused,
    payoutSchedule: normalizePayoutSchedule(normalized.payout_schedule),
    platformFeeOverridePercent:
      normalized.platform_fee_override_percent !== null &&
      normalized.platform_fee_override_percent !== undefined
        ? Number(normalized.platform_fee_override_percent)
        : null,
    paymentInternalNotes: row.payment_internal_notes?.trim() ?? "",
    paymentModel: resolveProviderPaymentModel(normalized.payment_model),
  };
}

export async function fetchProviderPaymentAuditLog(
  providerId: string,
  limit = 30,
): Promise<ProviderPaymentAuditEntry[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("provider_payment_audit_log")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[provider-payment-controls] audit log:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    action: String(row.action),
    previousValues: (row.previous_values ?? {}) as Record<string, unknown>,
    newValues: (row.new_values ?? {}) as Record<string, unknown>,
    note: row.note ?? null,
    adminUserId: row.admin_user_id ?? null,
    createdAt: String(row.created_at),
  }));
}

export async function updateProviderPaymentControls(
  providerId: string,
  update: ProviderPaymentControlsUpdate,
  adminUserId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const supabase = createSupabaseServiceRoleClient();
  const current = await fetchProviderPaymentControls(providerId);

  if (!current) {
    return { ok: false, error: "Provider not found." };
  }

  const patch: Database["public"]["Tables"]["providers"]["Update"] = {};
  const previousValues: Record<string, unknown> = {};
  const newValues: Record<string, unknown> = {};

  if (typeof update.paymentsEnabled === "boolean") {
    patch.payments_enabled = update.paymentsEnabled;
    previousValues.paymentsEnabled = current.paymentsEnabled;
    newValues.paymentsEnabled = update.paymentsEnabled;
  }

  if (typeof update.paymentsPaused === "boolean") {
    patch.payments_paused = update.paymentsPaused;
    previousValues.paymentsPaused = current.paymentsPaused;
    newValues.paymentsPaused = update.paymentsPaused;
  }

  if (update.payoutSchedule) {
    patch.payout_schedule = update.payoutSchedule;
    previousValues.payoutSchedule = current.payoutSchedule;
    newValues.payoutSchedule = update.payoutSchedule;
  }

  if (update.platformFeeOverridePercent !== undefined) {
    patch.platform_fee_override_percent = update.platformFeeOverridePercent;
    previousValues.platformFeeOverridePercent = current.platformFeeOverridePercent;
    newValues.platformFeeOverridePercent = update.platformFeeOverridePercent;
  }

  if (update.paymentInternalNotes !== undefined) {
    patch.payment_internal_notes = update.paymentInternalNotes;
    previousValues.paymentInternalNotes = current.paymentInternalNotes;
    newValues.paymentInternalNotes = update.paymentInternalNotes;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: true };
  }

  const { error: updateError } = await supabase
    .from("providers")
    .update(patch)
    .eq("id", providerId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  const { error: auditError } = await supabase
    .from("provider_payment_audit_log")
    .insert({
      provider_id: providerId,
      admin_user_id: adminUserId,
      action: "payment_controls_updated",
      previous_values: previousValues as Json,
      new_values: newValues as Json,
      note: null,
    });

  if (auditError) {
    console.error("[provider-payment-controls] audit insert:", auditError.message);
  }

  return { ok: true };
}
