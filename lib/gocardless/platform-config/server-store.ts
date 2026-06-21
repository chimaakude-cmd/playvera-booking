import { createSupabaseServiceRoleClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Json } from "@/lib/database.types";
import { DEFAULT_GOCARDLESS_PLATFORM_CONFIG, GOCARDLESS_PLATFORM_CONFIG_ID } from "./defaults";
import { rowToPayload, seedRowFromDefaults, updateToRowPatch } from "./mappers";
import type {
  GoCardlessPlatformConfigPayload,
  GoCardlessPlatformConfigRow,
  GoCardlessPlatformConfigUpdate,
  GoCardlessPlatformConnectionStatus,
  GoCardlessPlatformLogRow,
} from "./types";

export class GoCardlessPlatformConfigStoreError extends Error {
  constructor(
    message: string,
    readonly code: "not_configured" | "database" | "migration_required",
  ) {
    super(message);
    this.name = "GoCardlessPlatformConfigStoreError";
  }
}

const GOCARDLESS_MIGRATION_HINT =
  "Apply supabase/migrations/00050_gocardless_platform_config.sql in the Supabase SQL editor.";

type SupabaseLikeError = {
  message?: string;
  code?: string;
};

function isGoCardlessPlatformTableMissingError(error: SupabaseLikeError): boolean {
  const message = error.message?.toLowerCase() ?? "";
  const code = error.code ?? "";

  if (code === "PGRST205" || code === "42P01") {
    return (
      message.includes("gocardless_platform_config") ||
      message.includes("gocardless_platform_logs")
    );
  }

  if (
    message.includes("schema cache") &&
    (message.includes("gocardless_platform_config") ||
      message.includes("gocardless_platform_logs"))
  ) {
    return true;
  }

  if (
    message.includes("could not find") &&
    (message.includes("gocardless_platform_config") ||
      message.includes("gocardless_platform_logs"))
  ) {
    return true;
  }

  return (
    message.includes("relation") &&
    (message.includes("gocardless_platform_config") ||
      message.includes("gocardless_platform_logs")) &&
    message.includes("does not exist")
  );
}

function migrationRequiredError(): GoCardlessPlatformConfigStoreError {
  return new GoCardlessPlatformConfigStoreError(
    `GoCardless platform tables are not installed. ${GOCARDLESS_MIGRATION_HINT}`,
    "migration_required",
  );
}

export async function getServerGoCardlessPlatformConfig(): Promise<GoCardlessPlatformConfigPayload> {
  if (!isSupabaseConfigured()) {
    return DEFAULT_GOCARDLESS_PLATFORM_CONFIG;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("gocardless_platform_config")
    .select("*")
    .eq("id", GOCARDLESS_PLATFORM_CONFIG_ID)
    .maybeSingle();

  if (error) {
    if (isGoCardlessPlatformTableMissingError(error)) {
      throw migrationRequiredError();
    }
    throw new GoCardlessPlatformConfigStoreError(error.message, "database");
  }

  if (!data) {
    const seed = seedRowFromDefaults();
    const { data: inserted, error: insertError } = await supabase
      .from("gocardless_platform_config")
      .upsert(seed, { onConflict: "id" })
      .select("*")
      .single();

    if (insertError) {
      if (isGoCardlessPlatformTableMissingError(insertError)) {
        throw migrationRequiredError();
      }

      // Concurrent seed: another request inserted the singleton row first.
      if (insertError.code === "23505") {
        const { data: existing, error: refetchError } = await supabase
          .from("gocardless_platform_config")
          .select("*")
          .eq("id", GOCARDLESS_PLATFORM_CONFIG_ID)
          .maybeSingle();

        if (refetchError) {
          if (isGoCardlessPlatformTableMissingError(refetchError)) {
            throw migrationRequiredError();
          }
          throw new GoCardlessPlatformConfigStoreError(refetchError.message, "database");
        }

        if (existing) {
          return rowToPayload(existing as GoCardlessPlatformConfigRow);
        }
      }

      throw new GoCardlessPlatformConfigStoreError(insertError.message, "database");
    }

    return rowToPayload(inserted as GoCardlessPlatformConfigRow);
  }

  return rowToPayload(data as GoCardlessPlatformConfigRow);
}

export async function updateServerGoCardlessPlatformConfig(
  update: GoCardlessPlatformConfigUpdate,
  updatedBy: string | null,
): Promise<GoCardlessPlatformConfigPayload> {
  if (!isSupabaseConfigured()) {
    throw new GoCardlessPlatformConfigStoreError(
      "Supabase is not configured.",
      "not_configured",
    );
  }

  await getServerGoCardlessPlatformConfig();

  const supabase = createSupabaseServiceRoleClient();
  const patch = updateToRowPatch(update, updatedBy);

  const { data, error } = await supabase
    .from("gocardless_platform_config")
    .update(patch)
    .eq("id", GOCARDLESS_PLATFORM_CONFIG_ID)
    .select("*")
    .single();

  if (error) {
    if (isGoCardlessPlatformTableMissingError(error)) {
      throw migrationRequiredError();
    }
    throw new GoCardlessPlatformConfigStoreError(error.message, "database");
  }

  return rowToPayload(data as GoCardlessPlatformConfigRow);
}

export async function setGoCardlessConnectionStatus(params: {
  status: GoCardlessPlatformConnectionStatus;
  lastError?: string | null;
  updatedBy?: string | null;
}): Promise<GoCardlessPlatformConfigPayload> {
  if (!isSupabaseConfigured()) {
    return DEFAULT_GOCARDLESS_PLATFORM_CONFIG;
  }

  const supabase = createSupabaseServiceRoleClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("gocardless_platform_config")
    .update({
      connection_status: params.status,
      last_tested_at: now,
      last_error: params.lastError ?? null,
      updated_by: params.updatedBy ?? null,
    })
    .eq("id", GOCARDLESS_PLATFORM_CONFIG_ID)
    .select("*")
    .single();

  if (error) {
    if (isGoCardlessPlatformTableMissingError(error)) {
      throw migrationRequiredError();
    }
    throw new GoCardlessPlatformConfigStoreError(error.message, "database");
  }

  return rowToPayload(data as GoCardlessPlatformConfigRow);
}

export async function appendGoCardlessPlatformLog(params: {
  level?: "info" | "warn" | "error";
  eventType: string;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.log("[gocardless-platform-log]", params.eventType, params.message);
    return;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("gocardless_platform_logs").insert({
    level: params.level ?? "info",
    event_type: params.eventType,
    message: params.message,
    metadata: (params.metadata ?? {}) as Json,
  });

  if (error) {
    console.error("[gocardless] Failed to append platform log", error.message);
  }
}

export async function listGoCardlessPlatformLogs(
  limit = 50,
): Promise<GoCardlessPlatformLogRow[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("gocardless_platform_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[gocardless] Failed to list platform logs", error.message);
    return [];
  }

  return (data ?? []) as GoCardlessPlatformLogRow[];
}

export async function recordGoCardlessWebhookReceived(): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = createSupabaseServiceRoleClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("gocardless_platform_config")
    .update({ last_webhook_received_at: now })
    .eq("id", GOCARDLESS_PLATFORM_CONFIG_ID);

  if (error) {
    console.error("[gocardless] Failed to record webhook timestamp", error.message);
  }
}

export async function recordGoCardlessPaymentSplit(params: {
  bookingId: string;
  providerId: string;
  grossAmount: number;
  processingFee: number;
  platformFee: number;
  netAmount: number;
  status?: string;
  mandateId?: string | null;
  paymentId?: string | null;
}): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("gocardless_payments").insert({
    booking_id: params.bookingId,
    provider_id: params.providerId,
    amount: params.grossAmount,
    activora_fee: params.platformFee,
    gocardless_fee: params.processingFee,
    provider_net: params.netAmount,
    gross_amount: params.grossAmount,
    processing_fee: params.processingFee,
    platform_fee: params.platformFee,
    net_amount: params.netAmount,
    status: params.status ?? "payment_pending",
    mandate_id: params.mandateId ?? null,
    payment_id: params.paymentId ?? null,
  });

  if (error) {
    console.error("[gocardless] Failed to record payment split", error.message);
  }
}
