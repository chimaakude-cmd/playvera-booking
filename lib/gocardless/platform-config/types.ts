export type GoCardlessPlatformEnvironment = "sandbox" | "live";

export type GoCardlessPlatformConnectionStatus =
  | "not_configured"
  | "sandbox_connected"
  | "live_connected"
  | "error";

export type GoCardlessPlatformConfigRow = {
  id: number;
  environment: GoCardlessPlatformEnvironment;
  access_token: string | null;
  webhook_secret: string | null;
  client_id: string | null;
  client_secret: string | null;
  redirect_uri: string | null;
  callback_uri: string | null;
  platform_enabled: boolean;
  platform_fee_percent: number;
  connection_status: GoCardlessPlatformConnectionStatus;
  last_tested_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

export type GoCardlessPlatformConfigPayload = {
  environment: GoCardlessPlatformEnvironment;
  accessToken: string | null;
  webhookSecret: string | null;
  clientId: string | null;
  clientSecret: string | null;
  redirectUri: string | null;
  callbackUri: string | null;
  platformEnabled: boolean;
  platformFeePercent: number;
  connectionStatus: GoCardlessPlatformConnectionStatus;
  lastTestedAt: string | null;
  lastError: string | null;
  updatedAt: string;
};

/** Safe for admin UI — secrets masked */
export type GoCardlessPlatformConfigPublic = {
  environment: GoCardlessPlatformEnvironment;
  hasAccessToken: boolean;
  hasWebhookSecret: boolean;
  hasClientSecret: boolean;
  clientId: string | null;
  redirectUri: string | null;
  callbackUri: string | null;
  platformEnabled: boolean;
  platformFeePercent: number;
  connectionStatus: GoCardlessPlatformConnectionStatus;
  connectionStatusLabel: string;
  lastTestedAt: string | null;
  lastError: string | null;
  updatedAt: string;
  envOverrides: {
    clientId: boolean;
    clientSecret: boolean;
    redirectUri: boolean;
    accessToken: boolean;
    webhookSecret: boolean;
    environment: boolean;
  };
};

export type GoCardlessPlatformConfigUpdate = {
  environment?: GoCardlessPlatformEnvironment;
  accessToken?: string | null;
  webhookSecret?: string | null;
  clientId?: string | null;
  clientSecret?: string | null;
  redirectUri?: string | null;
  callbackUri?: string | null;
  platformEnabled?: boolean;
  platformFeePercent?: number;
};

export type GoCardlessPlatformLogRow = {
  id: string;
  level: "info" | "warn" | "error";
  event_type: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ResolvedGoCardlessPlatformConfig = {
  environment: GoCardlessPlatformEnvironment;
  accessToken: string | null;
  webhookSecret: string | null;
  clientId: string | null;
  clientSecret: string | null;
  redirectUri: string | null;
  callbackUri: string | null;
  platformEnabled: boolean;
  platformFeePercent: number;
  connectionStatus: GoCardlessPlatformConnectionStatus;
  isPlatformConfigured: boolean;
  isBillingConfigured: boolean;
  isClubConnectAvailable: boolean;
};
