import { createSupabaseServiceRoleClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Json } from "@/lib/database.types";
import {
  DEFAULT_STRIPE_PLATFORM_STATE,
  STRIPE_PLATFORM_STATE_ID,
} from "./defaults";
import type {
  StripePlatformConnectionStatus,
  StripePlatformLogRow,
  StripePlatformStatePayload,
  StripePlatformStateRow,
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
  "Apply supabase/migrations/00059_stripe_platform_admin.sql in the Supabase SQL editor.";

type SupabaseLikeError = {
  message?: string;
  code?: string;
};

function isStripePlatformTableMissingError(error: SupabaseLikeError): boolean {
  const message = error.message?.toLowerCase() ?? "";
  const code = error.code ?? "";

  if (code === "PGRST205" || code === "42P01") {
    return (
      message.includes("stripe_platform_state") ||
      message.includes("stripe_platform_logs")
    );
  }

  if (
    message.includes("schema cache") &&
    (message.includes("stripe_platform_state") ||
      message.includes("stripe_platform_logs"))
  ) {
    return true;
  }

  return (
    message.includes("relation") &&
    (message.includes("stripe_platform_state") ||
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

function rowToPayload(row: StripePlatformStateRow): StripePlatformStatePayload {
  return {
    connectionStatus: row.connection_status,
    lastTestedAt: row.last_tested_at,
    lastError: row.last_error,
    lastWebhookReceivedAt: row.last_webhook_received_at,
  };
}

export async function getServerStripePlatformState(): Promise<StripePlatformStatePayload> {
  if (!isSupabaseConfigured()) {
    return DEFAULT_STRIPE_PLATFORM_STATE;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("stripe_platform_state")
    .select("*")
    .eq("id", STRIPE_PLATFORM_STATE_ID)
    .maybeSingle();

  if (error) {
    if (isStripePlatformTableMissingError(error)) {
      throw migrationRequiredError();
    }
    throw new StripePlatformAdminStoreError(error.message, "database");
  }

  if (!data) {
    const { data: inserted, error: insertError } = await supabase
      .from("stripe_platform_state")
      .upsert({ id: STRIPE_PLATFORM_STATE_ID }, { onConflict: "id" })
      .select("*")
      .single();

    if (insertError) {
      if (isStripePlatformTableMissingError(insertError)) {
        throw migrationRequiredError();
      }
      throw new StripePlatformAdminStoreError(insertError.message, "database");
    }

    return rowToPayload(inserted as StripePlatformStateRow);
  }

  return rowToPayload(data as StripePlatformStateRow);
}

export async function setStripeConnectionStatus(params: {
  status: StripePlatformConnectionStatus;
  lastError?: string | null;
}): Promise<StripePlatformStatePayload> {
  if (!isSupabaseConfigured()) {
    return DEFAULT_STRIPE_PLATFORM_STATE;
  }

  const supabase = createSupabaseServiceRoleClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("stripe_platform_state")
    .update({
      connection_status: params.status,
      last_tested_at: now,
      last_error: params.lastError ?? null,
    })
    .eq("id", STRIPE_PLATFORM_STATE_ID)
    .select("*")
    .single();

  if (error) {
    if (isStripePlatformTableMissingError(error)) {
      throw migrationRequiredError();
    }
    throw new StripePlatformAdminStoreError(error.message, "database");
  }

  return rowToPayload(data as StripePlatformStateRow);
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
    .from("stripe_platform_state")
    .update({ last_webhook_received_at: now })
    .eq("id", STRIPE_PLATFORM_STATE_ID);

  if (error) {
    console.error("[stripe] Failed to record webhook timestamp", error.message);
  }
}
