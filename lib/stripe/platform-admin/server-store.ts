import { createSupabaseServiceRoleClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Json } from "@/lib/database.types";
import {
  DEFAULT_STRIPE_PLATFORM_CONFIG,
  STRIPE_PLATFORM_CONFIG_ID,
} from "./defaults";
import { rowToPayload, seedRowFromDefaults, updateToRowPatch } from "./mappers";
import type {
  StripePlatformConfigPayload,
  StripePlatformConfigRow,
  StripePlatformConfigUpdate,
  StripePlatformConnectionStatus,
  StripePlatformLogRow,
} from "./types";

export class StripePlatformAdminStoreError extends Error {
  constructor(
    message: string,
    readonly code: "not_configured" | "database" | "migration_required",
  ) {
    super(message);
    this.name = "StripePlatformAdminStoreError";
  }
}

const STRIPE_MIGRATION_HINT =
  "Apply supabase/migrations/00059_stripe_platform_admin.sql and 00060_stripe_platform_config.sql in the Supabase SQL editor.";

type SupabaseLikeError = {
  message?: string;
  code?: string;
};

function isStripePlatformTableMissingError(error: SupabaseLikeError): boolean {
  const message = error.message?.toLowerCase() ?? "";
  const code = error.code ?? "";

  if (code === "PGRST205" || code === "42P01") {
    return (
      message.includes("stripe_platform_config") ||
      message.includes("stripe_platform_state") ||
      message.includes("stripe_platform_logs")
    );
  }

  if (
    message.includes("schema cache") &&
    (message.includes("stripe_platform_config") ||
      message.includes("stripe_platform_state") ||
      message.includes("stripe_platform_logs"))
  ) {
    return true;
  }

  if (
    message.includes("could not find") &&
    (message.includes("stripe_platform_config") ||
      message.includes("stripe_platform_state") ||
      message.includes("stripe_platform_logs"))
  ) {
    return true;
  }

  return (
    message.includes("relation") &&
    (message.includes("stripe_platform_config") ||
      message.includes("stripe_platform_state") ||
      message.includes("stripe_platform_logs")) &&
    message.includes("does not exist")
  );
}

function migrationRequiredError(): StripePlatformAdminStoreError {
  return new StripePlatformAdminStoreError(
    `Stripe platform tables are not installed. ${STRIPE_MIGRATION_HINT}`,
    "migration_required",
  );
}

export async function getServerStripePlatformConfig(): Promise<StripePlatformConfigPayload> {
  if (!isSupabaseConfigured()) {
    return DEFAULT_STRIPE_PLATFORM_CONFIG;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("stripe_platform_config")
    .select("*")
    .eq("id", STRIPE_PLATFORM_CONFIG_ID)
    .maybeSingle();

  if (error) {
    if (isStripePlatformTableMissingError(error)) {
      throw migrationRequiredError();
    }
    throw new StripePlatformAdminStoreError(error.message, "database");
  }

  if (!data) {
    const seed = seedRowFromDefaults();
    const { data: inserted, error: insertError } = await supabase
      .from("stripe_platform_config")
      .upsert(seed, { onConflict: "id" })
      .select("*")
      .single();

    if (insertError) {
      if (isStripePlatformTableMissingError(insertError)) {
        throw migrationRequiredError();
      }

      if (insertError.code === "23505") {
        const { data: existing, error: refetchError } = await supabase
          .from("stripe_platform_config")
          .select("*")
          .eq("id", STRIPE_PLATFORM_CONFIG_ID)
          .maybeSingle();

        if (refetchError) {
          if (isStripePlatformTableMissingError(refetchError)) {
            throw migrationRequiredError();
          }
          throw new StripePlatformAdminStoreError(refetchError.message, "database");
        }

        if (existing) {
          return rowToPayload(existing as StripePlatformConfigRow);
        }
      }

      throw new StripePlatformAdminStoreError(insertError.message, "database");
    }

    return rowToPayload(inserted as StripePlatformConfigRow);
  }

  return rowToPayload(data as StripePlatformConfigRow);
}

/** @deprecated Use getServerStripePlatformConfig */
export async function getServerStripePlatformState(): Promise<StripePlatformConfigPayload> {
  return getServerStripePlatformConfig();
}

export async function updateServerStripePlatformConfig(
  update: StripePlatformConfigUpdate,
  updatedBy: string | null,
): Promise<StripePlatformConfigPayload> {
  if (!isSupabaseConfigured()) {
    throw new StripePlatformAdminStoreError(
      "Supabase is not configured.",
      "not_configured",
    );
  }

  await getServerStripePlatformConfig();

  const supabase = createSupabaseServiceRoleClient();
  const patch = updateToRowPatch(update, updatedBy);

  const { data, error } = await supabase
    .from("stripe_platform_config")
    .update(patch)
    .eq("id", STRIPE_PLATFORM_CONFIG_ID)
    .select("*")
    .single();

  if (error) {
    if (isStripePlatformTableMissingError(error)) {
      throw migrationRequiredError();
    }
    throw new StripePlatformAdminStoreError(error.message, "database");
  }

  return rowToPayload(data as StripePlatformConfigRow);
}

export async function setStripeConnectionStatus(params: {
  status: StripePlatformConnectionStatus;
  lastError?: string | null;
  updatedBy?: string | null;
}): Promise<StripePlatformConfigPayload> {
  if (!isSupabaseConfigured()) {
    return DEFAULT_STRIPE_PLATFORM_CONFIG;
  }

  const supabase = createSupabaseServiceRoleClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("stripe_platform_config")
    .update({
      connection_status: params.status,
      last_tested_at: now,
      last_error: params.lastError ?? null,
      updated_by: params.updatedBy ?? null,
    })
    .eq("id", STRIPE_PLATFORM_CONFIG_ID)
    .select("*")
    .single();

  if (error) {
    if (isStripePlatformTableMissingError(error)) {
      throw migrationRequiredError();
    }
    throw new StripePlatformAdminStoreError(error.message, "database");
  }

  return rowToPayload(data as StripePlatformConfigRow);
}

export async function appendStripePlatformLog(params: {
  level?: "info" | "warn" | "error";
  eventType: string;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.log("[stripe-platform-log]", params.eventType, params.message);
    return;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("stripe_platform_logs").insert({
    level: params.level ?? "info",
    event_type: params.eventType,
    message: params.message,
    metadata: (params.metadata ?? {}) as Json,
  });

  if (error) {
    console.error("[stripe] Failed to append platform log", error.message);
  }
}

export async function listStripePlatformLogs(
  limit = 50,
): Promise<StripePlatformLogRow[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("stripe_platform_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[stripe] Failed to list platform logs", error.message);
    return [];
  }

  return (data ?? []) as StripePlatformLogRow[];
}

export async function recordStripeWebhookReceived(): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = createSupabaseServiceRoleClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("stripe_platform_config")
    .update({ last_webhook_received_at: now })
    .eq("id", STRIPE_PLATFORM_CONFIG_ID);

  if (error) {
    console.error("[stripe] Failed to record webhook timestamp", error.message);
  }
}
