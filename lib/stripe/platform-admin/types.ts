export type StripePlatformEnvironment = "test" | "live";

export type StripePlatformConnectionStatus =
  | "not_configured"
  | "test_connected"
  | "live_connected"
  | "error";

export type StripePlatformConfigRow = {
  id: number;
  environment: StripePlatformEnvironment;
  secret_key: string | null;
  publishable_key: string | null;
  webhook_secret: string | null;
  platform_enabled: boolean;
  platform_fee_percent: number;
  connection_status: StripePlatformConnectionStatus;
  last_tested_at: string | null;
  last_error: string | null;
  last_webhook_received_at: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

export type StripePlatformConfigPayload = {
  environment: StripePlatformEnvironment;
  secretKey: string | null;
  publishableKey: string | null;
  webhookSecret: string | null;
  platformEnabled: boolean;
  platformFeePercent: number;
  connectionStatus: StripePlatformConnectionStatus;
  lastTestedAt: string | null;
  lastError: string | null;
  lastWebhookReceivedAt: string | null;
  updatedAt: string;
};

/** Safe for admin UI — secrets masked */
export type StripePlatformConfigPublic = {
  environment: StripePlatformEnvironment;
  environmentLabel: string;
  hasSecretKey: boolean;
  hasPublishableKey: boolean;
  hasWebhookSecret: boolean;
  secretKeyMasked: string | null;
  publishableKeyMasked: string | null;
  webhookSecretMasked: string | null;
  secretKeyPrefix: string | null;
  publishableKeyPrefix: string | null;
  keysModeMatch: boolean;
  platformEnabled: boolean;
  platformFeePercent: number;
  connectionStatus: StripePlatformConnectionStatus;
  connectionStatusLabel: string;
  lastTestedAt: string | null;
  lastError: string | null;
  lastWebhookReceivedAt: string | null;
  updatedAt: string;
  envOverrides: {
    secretKey: boolean;
    publishableKey: boolean;
    webhookSecret: boolean;
    environment: boolean;
  };
};

export type StripePlatformConfigUpdate = {
  environment?: StripePlatformEnvironment;
  secretKey?: string | null;
  publishableKey?: string | null;
  webhookSecret?: string | null;
  platformEnabled?: boolean;
  platformFeePercent?: number;
};

export type StripePlatformLogRow = {
  id: string;
  level: "info" | "warn" | "error";
  event_type: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ResolvedStripePlatformConfig = {
  environment: StripePlatformEnvironment;
  environmentLabel: string;
  secretKey: string | null;
  publishableKey: string | null;
  webhookSecret: string | null;
  platformEnabled: boolean;
  platformFeePercent: number;
  connectionStatus: StripePlatformConnectionStatus;
  isPlatformConfigured: boolean;
  isClubConnectAvailable: boolean;
  isConnectionVerified: boolean;
  isWebhookConfigured: boolean;
  clubConnectBlockers: string[];
  webhookUri: string;
};

export type StripeConnectedProviderSummary = {
  providerId: string;
  clubName: string;
  stripeStatus: string;
};
