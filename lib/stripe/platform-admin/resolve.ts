import type { NextRequest } from "next/server";
import { resolveServerAppBaseUrl } from "@/lib/app-url";
import { probeStripeConnectEnabled } from "@/lib/stripe/connect-probe";
import {
  getStripeEnvFromProcessEnv,
  resolveStripeModeFromPublishableKey,
  resolveStripeModeFromSecretKey,
  validateStripeKeyModeMatch,
  validateStripePublishableKey,
  validateStripeSecretKey,
  validateStripeWebhookSecret,
  type StripeEnvConfig,
} from "@/lib/stripe/env";
import {
  isStripePlatformConnectionVerified,
  resolveStripeConnectionStatusFromProbe,
} from "./connection-status";
import { payloadToPublic } from "./mappers";
import { getServerStripePlatformConfig } from "./server-store";
import type {
  ResolvedStripeCredentials,
  ResolvedStripePlatformConfig,
  StripePlatformConfigPayload,
  StripePlatformConfigPublic,
  StripePlatformEnvironment,
} from "./types";

function pickString(
  envValue: string | null,
  dbValue: string | null,
): string | null {
  return envValue?.trim() || dbValue?.trim() || null;
}

function pickEnvironment(
  envValue: "test" | "live",
  dbValue: "test" | "live",
  envOverride: boolean,
): "test" | "live" {
  if (envOverride) {
    return envValue;
  }
  return dbValue;
}

function environmentLabel(mode: "test" | "live"): string {
  return mode === "live" ? "Live" : "Test mode";
}

function resolvedKeyModeLabel(mode: StripePlatformEnvironment | null): string {
  if (mode === "live") {
    return "Stripe: Live";
  }
  if (mode === "test") {
    return "Stripe: Test";
  }
  return "Stripe: Not configured";
}

function resolveKeyModeMismatch(
  environment: StripePlatformEnvironment,
  keyMode: StripePlatformEnvironment | null,
): boolean {
  return Boolean(keyMode && keyMode !== environment);
}

export async function getResolvedStripeCredentials(
  cachedPayload?: StripePlatformConfigPayload,
): Promise<ResolvedStripeCredentials> {
  const resolved = await getResolvedStripeEnv(cachedPayload);
  const keyMode = resolveStripeModeFromSecretKey(resolved.secretKey);

  return {
    secretKey: resolved.secretKey,
    publishableKey: resolved.publishableKey,
    webhookSecret: resolved.webhookSecret,
    environment: resolved.environment,
    keyMode,
    environmentKeyMismatch: resolveKeyModeMismatch(resolved.environment, keyMode),
  };
}

export function getEnvOverrideFlags(processEnv: StripeEnvConfig) {
  return {
    secretKey: Boolean(processEnv.secretKey?.trim()),
    publishableKey: Boolean(processEnv.publishableKey?.trim()),
    webhookSecret: Boolean(processEnv.webhookSecret?.trim()),
    environment: Boolean(processEnv.environmentOverride),
  };
}

export async function getResolvedStripeEnv(
  cachedPayload?: StripePlatformConfigPayload,
): Promise<
  StripeEnvConfig & {
    connectionStatus: StripePlatformConfigPayload["connectionStatus"];
    lastTestedAt: string | null;
    lastError: string | null;
    lastWebhookReceivedAt: string | null;
    platformEnabled: boolean;
    platformFeePercent: number;
  }
> {
  const processEnv = getStripeEnvFromProcessEnv();
  const db = cachedPayload ?? (await getServerStripePlatformConfig());
  const envOverrides = getEnvOverrideFlags(processEnv);

  const environment = pickEnvironment(
    processEnv.environment,
    db.environment,
    envOverrides.environment,
  );

  const secretKey = pickString(processEnv.secretKey, db.secretKey);
  const publishableKey = pickString(processEnv.publishableKey, db.publishableKey);
  const webhookSecret = pickString(processEnv.webhookSecret, db.webhookSecret);

  return {
    secretKey,
    publishableKey,
    webhookSecret,
    environment,
    environmentOverride: envOverrides.environment,
    platformEnabled: db.platformEnabled,
    platformFeePercent: db.platformFeePercent,
    connectionStatus: db.connectionStatus,
    lastTestedAt: db.lastTestedAt,
    lastError: db.lastError,
    lastWebhookReceivedAt: db.lastWebhookReceivedAt,
  };
}

export async function resolveStripePlatformConfig(
  request: NextRequest,
  cachedPayload?: StripePlatformConfigPayload,
): Promise<ResolvedStripePlatformConfig & { public: StripePlatformConfigPublic }> {
  const processEnv = getStripeEnvFromProcessEnv();
  const db = cachedPayload ?? (await getServerStripePlatformConfig());
  const envOverrides = getEnvOverrideFlags(processEnv);
  const resolved = await getResolvedStripeEnv(db);
  const baseUrl = resolveServerAppBaseUrl(request);

  const secretValidation = validateStripeSecretKey(resolved.secretKey ?? undefined);
  const publishableValidation = validateStripePublishableKey(
    resolved.publishableKey ?? undefined,
  );
  const modeMatch = validateStripeKeyModeMatch(
    resolved.secretKey ?? undefined,
    resolved.publishableKey ?? undefined,
  );
  const webhookValidation = validateStripeWebhookSecret(
    resolved.webhookSecret ?? undefined,
  );

  const clubConnectBlockers: string[] = [];

  if (!resolved.platformEnabled) {
    clubConnectBlockers.push(
      "Platform is disabled — enable “Platform enabled” in admin setup.",
    );
  }
  if (!secretValidation.valid) {
    clubConnectBlockers.push("Set STRIPE_SECRET_KEY (sk_test_ or sk_live_).");
  }
  if (!publishableValidation.valid) {
    clubConnectBlockers.push(
      "Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_test_ or pk_live_).",
    );
  }
  if (!modeMatch.valid && modeMatch.error) {
    clubConnectBlockers.push(modeMatch.error);
  }
  if (!webhookValidation.valid) {
    clubConnectBlockers.push("Set STRIPE_WEBHOOK_SECRET (whsec_).");
  }

  const secretMode = resolveStripeModeFromSecretKey(resolved.secretKey);
  const publishableMode = resolveStripeModeFromPublishableKey(resolved.publishableKey);
  const environmentKeyMismatch = resolveKeyModeMismatch(
    resolved.environment,
    secretMode,
  );

  if (secretMode && secretMode !== resolved.environment) {
    clubConnectBlockers.push(
      `Secret key is ${secretMode} mode but environment is set to ${resolved.environment}. Update Environment or use matching API keys.`,
    );
  }
  if (publishableMode && publishableMode !== resolved.environment) {
    clubConnectBlockers.push(
      `Publishable key is ${publishableMode} mode but environment is set to ${resolved.environment}.`,
    );
  }

  let connectionStatus = resolved.connectionStatus;

  if (
    secretValidation.valid &&
    publishableValidation.valid &&
    modeMatch.valid &&
    !isStripePlatformConnectionVerified(connectionStatus, secretMode)
  ) {
    const probe = await probeStripeConnectEnabled(resolved.secretKey);
    if (probe.connectEnabled && secretMode) {
      connectionStatus = resolveStripeConnectionStatusFromProbe({
        secretKeyValid: probe.secretKeyValid,
        connectEnabled: probe.connectEnabled,
        mode: secretMode,
        existingStatus: connectionStatus,
      });
    } else if (probe.platformMisconfigured) {
      connectionStatus = "error";
      clubConnectBlockers.push(
        "Enable Stripe Connect (Express, UK) in Stripe Dashboard.",
      );
    }
  }

  const isPlatformConfigured =
    secretValidation.valid && publishableValidation.valid;
  const isWebhookConfigured = webhookValidation.valid;
  const isConnectionVerified = isStripePlatformConnectionVerified(
    connectionStatus,
    secretMode,
  );
  const isClubConnectAvailable =
    resolved.platformEnabled &&
    isPlatformConfigured &&
    modeMatch.valid &&
    isConnectionVerified &&
    !environmentKeyMismatch &&
    !clubConnectBlockers.some((blocker) =>
      blocker.includes("Enable Stripe Connect"),
    );

  if (isPlatformConfigured && !isConnectionVerified) {
    clubConnectBlockers.push("Run Test connection to verify Stripe Connect.");
  }

  const publicConfig: StripePlatformConfigPublic = {
    ...payloadToPublic(
      {
        ...db,
        connectionStatus,
      },
      envOverrides,
      {
        secretKeyPrefix: secretValidation.prefix ?? null,
        publishableKeyPrefix: publishableValidation.prefix ?? null,
        keysModeMatch: modeMatch.valid,
      },
    ),
    hasSecretKey: secretValidation.valid,
    hasPublishableKey: publishableValidation.valid,
    hasWebhookSecret: webhookValidation.valid,
    environment: resolved.environment,
    environmentLabel: environmentLabel(resolved.environment),
    resolvedKeyMode: secretMode,
    resolvedKeyModeLabel: resolvedKeyModeLabel(secretMode),
    environmentKeyMismatch,
  };

  return {
    environment: resolved.environment,
    environmentLabel: environmentLabel(resolved.environment),
    resolvedKeyMode: secretMode,
    resolvedKeyModeLabel: resolvedKeyModeLabel(secretMode),
    environmentKeyMismatch,
    secretKey: resolved.secretKey,
    publishableKey: resolved.publishableKey,
    webhookSecret: resolved.webhookSecret,
    platformEnabled: resolved.platformEnabled,
    platformFeePercent: resolved.platformFeePercent,
    connectionStatus,
    isPlatformConfigured,
    isClubConnectAvailable,
    isConnectionVerified,
    isWebhookConfigured,
    clubConnectBlockers,
    webhookUri: `${baseUrl}/api/stripe/webhook`,
    public: publicConfig,
  };
}

export function resolveStripeEnvironmentBadge(mode: "test" | "live" | null): {
  label: string;
  tone: "sandbox" | "live" | "neutral";
} {
  if (mode === "live") {
    return { label: "Live", tone: "live" };
  }
  if (mode === "test") {
    return { label: "Test mode", tone: "sandbox" };
  }
  return { label: "Not configured", tone: "neutral" };
}

export async function getStripePlatformFeePercent(): Promise<number> {
  const resolved = await getResolvedStripeEnv();
  return resolved.platformFeePercent;
}
