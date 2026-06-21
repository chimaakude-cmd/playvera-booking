export type GoCardlessEnvironment = "sandbox" | "live";

export type GoCardlessEnvConfig = {
  /** Platform OAuth client ID for club connect flow */
  clientId: string | null;
  /** Platform OAuth client secret */
  clientSecret: string | null;
  /** OAuth redirect URI registered with GoCardless */
  redirectUri: string | null;
  /** Access token for platform subscription billing (Pro/Franchise) */
  accessToken: string | null;
  environment: GoCardlessEnvironment;
  webhookSecret: string | null;
  /** OAuth credentials configured for club connect */
  isPlatformConfigured: boolean;
  /** Access token configured for subscription billing API */
  isBillingConfigured: boolean;
  /** @deprecated Use isPlatformConfigured — kept for legacy callers */
  isConfigured: boolean;
};

function resolveEnvironmentFromProcessEnv(): GoCardlessEnvironment {
  const envRaw = (
    process.env.GOCARDLESS_ENVIRONMENT ??
    process.env.GOCARDLESS_ENV
  )
    ?.trim()
    .toLowerCase();

  return envRaw === "live" ? "live" : "sandbox";
}

export function getGoCardlessConnectBaseUrl(
  environment: GoCardlessEnvironment = resolveEnvironmentFromProcessEnv(),
): string {
  return environment === "live"
    ? "https://connect.gocardless.com"
    : "https://connect-sandbox.gocardless.com";
}

/** Process env only — prefer getResolvedGoCardlessEnv() for runtime resolution. */
export function getGoCardlessEnvFromProcessEnv(): GoCardlessEnvConfig {
  const clientId = process.env.GOCARDLESS_CLIENT_ID?.trim() || null;
  const clientSecret = process.env.GOCARDLESS_CLIENT_SECRET?.trim() || null;
  const redirectUri = process.env.GOCARDLESS_REDIRECT_URI?.trim() || null;
  const accessToken = process.env.GOCARDLESS_ACCESS_TOKEN?.trim() || null;
  const environment = resolveEnvironmentFromProcessEnv();
  const webhookSecret = process.env.GOCARDLESS_WEBHOOK_SECRET?.trim() || null;

  const isPlatformConfigured = Boolean(
    clientId && clientSecret && redirectUri,
  );
  const isBillingConfigured = Boolean(accessToken);

  return {
    clientId,
    clientSecret,
    redirectUri,
    accessToken,
    environment,
    webhookSecret,
    isPlatformConfigured,
    isBillingConfigured,
    isConfigured: isBillingConfigured,
  };
}

/** @deprecated Prefer getResolvedGoCardlessEnv() — env vars only */
export function getGoCardlessEnv(): GoCardlessEnvConfig {
  return getGoCardlessEnvFromProcessEnv();
}
