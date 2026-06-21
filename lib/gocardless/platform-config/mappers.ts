import {
  DEFAULT_GOCARDLESS_PLATFORM_CONFIG,
  GOCARDLESS_CONNECTION_STATUS_LABELS,
} from "./defaults";
import type {
  GoCardlessPlatformConfigPayload,
  GoCardlessPlatformConfigPublic,
  GoCardlessPlatformConfigRow,
  GoCardlessPlatformConfigUpdate,
  GoCardlessPlatformConnectionStatus,
  GoCardlessPlatformEnvironment,
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

function normalizeEnvironment(value: string | null | undefined): GoCardlessPlatformEnvironment {
  return value === "live" ? "live" : "sandbox";
}

function normalizeConnectionStatus(
  value: string | null | undefined,
): GoCardlessPlatformConnectionStatus {
  if (
    value === "sandbox_connected" ||
    value === "live_connected" ||
    value === "error"
  ) {
    return value;
  }
  return "not_configured";
}

export function rowToPayload(
  row: GoCardlessPlatformConfigRow,
): GoCardlessPlatformConfigPayload {
  return {
    environment: normalizeEnvironment(row.environment),
    accessToken: row.access_token,
    webhookSecret: row.webhook_secret,
    clientId: row.client_id,
    clientSecret: row.client_secret,
    redirectUri: row.redirect_uri,
    callbackUri: row.callback_uri,
    platformEnabled: row.platform_enabled,
    platformFeePercent: Number(row.platform_fee_percent),
    connectionStatus: normalizeConnectionStatus(row.connection_status),
    lastTestedAt: row.last_tested_at,
    lastError: row.last_error,
    updatedAt: row.updated_at,
  };
}

export function payloadToPublic(
  payload: GoCardlessPlatformConfigPayload,
  envOverrides: GoCardlessPlatformConfigPublic["envOverrides"],
): GoCardlessPlatformConfigPublic {
  return {
    environment: payload.environment,
    hasAccessToken: Boolean(payload.accessToken?.trim()),
    hasWebhookSecret: Boolean(payload.webhookSecret?.trim()),
    hasClientSecret: Boolean(payload.clientSecret?.trim()),
    accessTokenMasked: maskSecret(payload.accessToken),
    webhookSecretMasked: maskSecret(payload.webhookSecret),
    clientSecretMasked: maskSecret(payload.clientSecret),
    clientId: payload.clientId,
    redirectUri: payload.redirectUri,
    callbackUri: payload.callbackUri,
    platformEnabled: payload.platformEnabled,
    platformFeePercent: payload.platformFeePercent,
    connectionStatus: payload.connectionStatus,
    connectionStatusLabel:
      GOCARDLESS_CONNECTION_STATUS_LABELS[payload.connectionStatus],
    lastTestedAt: payload.lastTestedAt,
    lastError: payload.lastError,
    updatedAt: payload.updatedAt,
    envOverrides,
  };
}

export function updateToRowPatch(
  update: GoCardlessPlatformConfigUpdate,
  updatedBy: string | null,
): Partial<GoCardlessPlatformConfigRow> {
  const patch: Partial<GoCardlessPlatformConfigRow> = { updated_by: updatedBy };

  if (update.environment !== undefined) {
    patch.environment = update.environment;
  }
  if (update.accessToken !== undefined) {
    patch.access_token = update.accessToken?.trim() || null;
  }
  if (update.webhookSecret !== undefined) {
    patch.webhook_secret = update.webhookSecret?.trim() || null;
  }
  if (update.clientId !== undefined) {
    patch.client_id = update.clientId?.trim() || null;
  }
  if (update.clientSecret !== undefined) {
    patch.client_secret = update.clientSecret?.trim() || null;
  }
  if (update.redirectUri !== undefined) {
    patch.redirect_uri = update.redirectUri?.trim() || null;
  }
  if (update.callbackUri !== undefined) {
    patch.callback_uri = update.callbackUri?.trim() || null;
  }
  if (update.platformEnabled !== undefined) {
    patch.platform_enabled = update.platformEnabled;
  }
  if (update.platformFeePercent !== undefined) {
    patch.platform_fee_percent = update.platformFeePercent;
  }

  if (
    update.accessToken !== undefined ||
    update.environment !== undefined ||
    update.clientId !== undefined ||
    update.clientSecret !== undefined
  ) {
    patch.connection_status = "not_configured";
    patch.last_error = null;
    patch.last_tested_at = null;
  }

  return patch;
}

export function seedRowFromDefaults(): Omit<
  GoCardlessPlatformConfigRow,
  "created_at" | "updated_at" | "updated_by" | "last_tested_at" | "last_error"
> {
  const defaults = DEFAULT_GOCARDLESS_PLATFORM_CONFIG;
  return {
    id: 1,
    environment: defaults.environment,
    access_token: defaults.accessToken,
    webhook_secret: defaults.webhookSecret,
    client_id: defaults.clientId,
    client_secret: defaults.clientSecret,
    redirect_uri: defaults.redirectUri,
    callback_uri: defaults.callbackUri,
    platform_enabled: defaults.platformEnabled,
    platform_fee_percent: defaults.platformFeePercent,
    connection_status: defaults.connectionStatus,
  };
}
