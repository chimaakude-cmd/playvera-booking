import { resolveServerAppBaseUrl } from "@/lib/app-url";
import type { GoCardlessEnvConfig, GoCardlessEnvironment } from "../env";
import { getGoCardlessEnvFromProcessEnv } from "../env";
import { isPlatformConnectionVerified } from "./connection-status";
import { getServerGoCardlessPlatformConfig } from "./server-store";
import type {
  GoCardlessPlatformConfigPayload,
  ResolvedGoCardlessPlatformConfig,
} from "./types";

function pickString(
  envValue: string | null,
  dbValue: string | null,
): string | null {
  return envValue?.trim() || dbValue?.trim() || null;
}

function pickEnvironment(
  envValue: GoCardlessEnvironment,
  dbValue: GoCardlessEnvironment,
  envOverride: boolean,
): GoCardlessEnvironment {
  if (envOverride) {
    return envValue;
  }
  return dbValue;
}

export function getEnvOverrideFlags(processEnv: GoCardlessEnvConfig) {
  return {
    clientId: Boolean(process.env.GOCARDLESS_CLIENT_ID?.trim()),
    clientSecret: Boolean(process.env.GOCARDLESS_CLIENT_SECRET?.trim()),
    redirectUri: Boolean(process.env.GOCARDLESS_REDIRECT_URI?.trim()),
    accessToken: Boolean(process.env.GOCARDLESS_ACCESS_TOKEN?.trim()),
    webhookSecret: Boolean(process.env.GOCARDLESS_WEBHOOK_SECRET?.trim()),
    environment: Boolean(
      process.env.GOCARDLESS_ENVIRONMENT?.trim() ||
        process.env.GOCARDLESS_ENV?.trim(),
    ),
  };
}

export async function resolveGoCardlessPlatformConfig(
  request?: Request,
  cachedPayload?: GoCardlessPlatformConfigPayload,
): Promise<ResolvedGoCardlessPlatformConfig> {
  const processEnv = getGoCardlessEnvFromProcessEnv();
  const db = cachedPayload ?? (await getServerGoCardlessPlatformConfig());
  const envOverrides = getEnvOverrideFlags(processEnv);
  const baseUrl = resolveServerAppBaseUrl(request);
  const defaultCallback = `${baseUrl}/api/gocardless/connect/callback`;

  const environment = pickEnvironment(
    processEnv.environment,
    db.environment,
    envOverrides.environment,
  );

  const clientId = pickString(processEnv.clientId, db.clientId);
  const clientSecret = pickString(processEnv.clientSecret, db.clientSecret);
  const redirectUri = pickString(processEnv.redirectUri, db.redirectUri);
  const callbackUri =
    db.callbackUri?.trim() || redirectUri || defaultCallback;
  const accessToken = pickString(processEnv.accessToken, db.accessToken);
  const webhookSecret = pickString(processEnv.webhookSecret, db.webhookSecret);

  const oauthReady = Boolean(clientId && clientSecret && redirectUri);
  const billingReady = Boolean(accessToken);
  const platformEnabled = db.platformEnabled;
  const connectionVerified = isPlatformConnectionVerified(
    db.connectionStatus,
    environment,
  );

  return {
    environment,
    accessToken,
    webhookSecret,
    clientId,
    clientSecret,
    redirectUri,
    callbackUri,
    platformEnabled,
    platformFeePercent: db.platformFeePercent,
    connectionStatus: db.connectionStatus,
    isPlatformConfigured: oauthReady && billingReady && connectionVerified,
    isBillingConfigured: billingReady,
    isClubConnectAvailable: platformEnabled && oauthReady && connectionVerified,
  };
}

/** Build env-compatible config from resolved platform settings */
export function toGoCardlessEnvConfig(
  resolved: ResolvedGoCardlessPlatformConfig,
): GoCardlessEnvConfig {
  const oauthReady = Boolean(
    resolved.clientId && resolved.clientSecret && resolved.redirectUri,
  );

  return {
    clientId: resolved.clientId,
    clientSecret: resolved.clientSecret,
    redirectUri: resolved.redirectUri,
    accessToken: resolved.accessToken,
    environment: resolved.environment,
    webhookSecret: resolved.webhookSecret,
    isPlatformConfigured: oauthReady,
    isBillingConfigured: Boolean(resolved.accessToken),
    isConfigured: Boolean(resolved.accessToken),
  };
}

export async function getResolvedGoCardlessEnv(
  request?: Request,
): Promise<GoCardlessEnvConfig> {
  const resolved = await resolveGoCardlessPlatformConfig(request);
  return toGoCardlessEnvConfig(resolved);
}

export async function getGoCardlessPlatformFeePercent(): Promise<number> {
  const db = await getServerGoCardlessPlatformConfig();
  return db.platformFeePercent;
}
