import { getAdminSupabaseClient } from "@/lib/admin/supabase-client";
import {
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";

export type ProviderDeleteActor = {
  actorId: string;
  actorType: "admin" | "club_owner";
  actorEmail?: string | null;
};

export type ProviderDeletePreview = {
  hasFinanceRecords: boolean;
  financeWarning: string | null;
};

export type ProviderDeleteResult =
  | { ok: true; providerId: string; financeWarning: string | null }
  | { ok: false; error: string };

const FINANCE_RETENTION_WARNING =
  "Provider has payout records. Finance records will be retained.";

export async function previewProviderDelete(
  providerId: string,
): Promise<ProviderDeletePreview> {
  const hasFinanceRecords = await providerHasFinanceRecords(providerId);

  return {
    hasFinanceRecords,
    financeWarning: hasFinanceRecords ? FINANCE_RETENTION_WARNING : null,
  };
}

async function providerHasFinanceRecords(providerId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const supabase = getAdminSupabaseClient();

  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("id")
    .eq("provider_id", providerId);

  if (sessionsError) {
    console.error(
      "[Provider delete] Failed to load sessions for finance check:",
      sessionsError.message,
    );
    return false;
  }

  const sessionIds = (sessions ?? []).map((row) => row.id);
  if (sessionIds.length === 0) {
    return false;
  }

  const { count, error: bookingsError } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .in("session_id", sessionIds)
    .neq("status", "cancelled");

  if (bookingsError) {
    console.error(
      "[Provider delete] Failed to count bookings for finance check:",
      bookingsError.message,
    );
    return false;
  }

  return (count ?? 0) > 0;
}

async function writeDeletionAuditLog(input: {
  providerId: string;
  actor: ProviderDeleteActor;
  financeRecordsRetained: boolean;
  note?: string | null;
}): Promise<void> {
  const supabase = getAdminSupabaseClient();
  const { error } = await supabase.from("provider_deletion_audit_log").insert({
    provider_id: input.providerId,
    actor_id: input.actor.actorId,
    actor_type: input.actor.actorType,
    actor_email: input.actor.actorEmail?.trim() || null,
    finance_records_retained: input.financeRecordsRetained,
    note: input.note?.trim() || null,
  });

  if (error && !error.message.includes("provider_deletion_audit_log")) {
    console.error("[Provider delete] Audit log insert failed:", error.message);
  }
}

export async function deleteProviderPermanently(
  providerId: string,
  actor: ProviderDeleteActor,
): Promise<ProviderDeleteResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const providerIdTrimmed = providerId.trim();
  if (!providerIdTrimmed) {
    return { ok: false, error: "Provider id is required." };
  }

  const supabase = getAdminSupabaseClient();
  const deletedAt = new Date().toISOString();

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, auth_user_id, lifecycle_status")
    .eq("id", providerIdTrimmed)
    .maybeSingle();

  if (providerError) {
    return { ok: false, error: providerError.message };
  }

  if (!provider?.id) {
    return { ok: false, error: "Provider not found." };
  }

  if (provider.lifecycle_status === "deleted") {
    return { ok: false, error: "Provider is already deleted." };
  }

  const financePreview = await previewProviderDelete(providerIdTrimmed);

  const { error: providerUpdateError } = await supabase
    .from("providers")
    .update({
      lifecycle_status: "deleted",
      onboarding_completed: false,
      deleted_at: deletedAt,
      account_status: "suspended",
      payments_enabled: false,
      payments_paused: true,
    })
    .eq("id", providerIdTrimmed);

  if (providerUpdateError) {
    return { ok: false, error: providerUpdateError.message };
  }

  await Promise.all([
    supabase
      .from("club_profiles")
      .update({ published: false, verified: false })
      .eq("provider_id", providerIdTrimmed),
    supabase
      .from("sessions")
      .update({ published: false, updated_at: deletedAt })
      .eq("provider_id", providerIdTrimmed),
    supabase
      .from("club_team_members")
      .update({ status: "pending" })
      .eq("provider_id", providerIdTrimmed),
  ]);

  if (provider.auth_user_id && isSupabaseServiceRoleConfigured()) {
    const service = createSupabaseServiceRoleClient();
    const { error: banError } = await service.auth.admin.updateUserById(
      provider.auth_user_id,
      { ban_duration: "876000h" },
    );

    if (banError) {
      console.error("[Provider delete] Failed to disable auth user:", banError.message);
    }
  }

  await writeDeletionAuditLog({
    providerId: providerIdTrimmed,
    actor,
    financeRecordsRetained: financePreview.hasFinanceRecords,
  });

  return {
    ok: true,
    providerId: providerIdTrimmed,
    financeWarning: financePreview.financeWarning,
  };
}
