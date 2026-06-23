import {
  DEFAULT_STRIPE_PLATFORM_CONFIG,
  STRIPE_CONNECTION_STATUS_LABELS,
} from "./defaults";
import type {
  StripePlatformConfigPayload,
  StripePlatformConfigPublic,
  StripePlatformConfigRow,
  StripePlatformConfigUpdate,
  StripePlatformConnectionStatus,
  StripePlatformEnvironment,
} from "./types";

/** Mask a secret for safe API responses — never returns the raw value. */
export function maskSecret(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length <= 4) {
    return "••••";
  }
  return `••••${trimmed.slice(-4)}`;
}

function environmentLabel(mode: StripePlatformEnvironment): string {
  return mode === "live" ? "Live" : "Test mode";
}

function normalizeEnvironment(
  value: string | null | undefined,
): StripePlatformEnvironment {
  return value === "live" ? "live" : "test";
}

function normalizeConnectionStatus(
  value: string | null | undefined,
): StripePlatformConnectionStatus {
  if (
    value === "test_connected" ||
    value === "live_connected" ||
    value === "error"
  ) {
    return value;
  }
  return "not_configured";
}

export function rowToPayload(
  row: StripePlatformConfigRow,
): StripePlatformConfigPayload {
  return {
    environment: normalizeEnvironment(row.environment),
    secretKey: row.secret_key,
    publishableKey: row.publishable_key,
    webhookSecret: row.webhook_secret,
    platformEnabled: row.platform_enabled,
    platformFeePercent: Number(row.platform_fee_percent),
    connectionStatus: normalizeConnectionStatus(row.connection_status),
    lastTestedAt: row.last_tested_at,
    lastError: row.last_error,
    lastWebhookReceivedAt: row.last_webhook_received_at,
    updatedAt: row.updated_at,
  };
}

export function payloadToPublic(
  payload: StripePlatformConfigPayload,
  envOverrides: StripePlatformConfigPublic["envOverrides"],
  resolved?: {
    secretKeyPrefix?: string | null;
    publishableKeyPrefix?: string | null;
    keysModeMatch?: boolean;
  },
): StripePlatformConfigPublic {
  return {
    environment: payload.environment,
    environmentLabel: environmentLabel(payload.environment),
    resolvedKeyMode: null,
    resolvedKeyModeLabel: "Stripe: Not configured",
    environmentKeyMismatch: false,
    hasSecretKey: Boolean(payload.secretKey?.trim()),
    hasPublishableKey: Boolean(payload.publishableKey?.trim()),
    hasWebhookSecret: Boolean(payload.webhookSecret?.trim()),
    secretKeyMasked: maskSecret(payload.secretKey),
    publishableKeyMasked: maskSecret(payload.publishableKey),
    webhookSecretMasked: maskSecret(payload.webhookSecret),
    secretKeyPrefix: resolved?.secretKeyPrefix ?? null,
    publishableKeyPrefix: resolved?.publishableKeyPrefix ?? null,
    keysModeMatch: resolved?.keysModeMatch ?? true,
    platformEnabled: payload.platformEnabled,
    platformFeePercent: payload.platformFeePercent,
    connectionStatus: payload.connectionStatus,
    connectionStatusLabel:
      STRIPE_CONNECTION_STATUS_LABELS[payload.connectionStatus],
    lastTestedAt: payload.lastTestedAt,
    lastError: payload.lastError,
    lastWebhookReceivedAt: payload.lastWebhookReceivedAt,
    updatedAt: payload.updatedAt,
    envOverrides,
  };
}

export function updateToRowPatch(
  update: StripePlatformConfigUpdate,
  updatedBy: string | null,
): Partial<StripePlatformConfigRow> {
  const patch: Partial<StripePlatformConfigRow> = { updated_by: updatedBy };

  if (update.environment !== undefined) {
    patch.environment = update.environment;
  }
  if (update.secretKey !== undefined) {
    patch.secret_key = update.secretKey?.trim() || null;
  }
  if (update.publishableKey !== undefined) {
    patch.publishable_key = update.publishableKey?.trim() || null;
  }
  if (update.webhookSecret !== undefined) {
    patch.webhook_secret = update.webhookSecret?.trim() || null;
  }
  if (update.platformEnabled !== undefined) {
    patch.platform_enabled = update.platformEnabled;
  }
  if (update.platformFeePercent !== undefined) {
    patch.platform_fee_percent = update.platformFeePercent;
  }

  if (
    update.secretKey !== undefined ||
    update.publishableKey !== undefined ||
    update.environment !== undefined
  ) {
    patch.connection_status = "not_configured";
    patch.last_error = null;
    patch.last_tested_at = null;
  }

  return patch;
}

export function seedRowFromDefaults(): Omit<
  StripePlatformConfigRow,
  | "created_at"
  | "updated_at"
  | "updated_by"
  | "last_tested_at"
  | "last_error"
  | "last_webhook_received_at"
> {
  const defaults = DEFAULT_STRIPE_PLATFORM_CONFIG;
  return {
    id: 1,
    environment: defaults.environment,
    secret_key: defaults.secretKey,
    publishable_key: defaults.publishableKey,
    webhook_secret: defaults.webhookSecret,
    platform_enabled: defaults.platformEnabled,
    platform_fee_percent: defaults.platformFeePercent,
    connection_status: defaults.connectionStatus,
  };
}
