export type StripePlatformConnectionStatus =
  | "not_configured"
  | "test_connected"
  | "live_connected"
  | "error";

export type StripePlatformLogRow = {
  id: string;
  level: "info" | "warn" | "error";
  event_type: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type StripePlatformStateRow = {
  id: number;
  connection_status: StripePlatformConnectionStatus;
  last_tested_at: string | null;
  last_error: string | null;
  last_webhook_received_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StripePlatformStatePayload = {
  connectionStatus: StripePlatformConnectionStatus;
  lastTestedAt: string | null;
  lastError: string | null;
  lastWebhookReceivedAt: string | null;
};

export type StripePlatformConfigPublic = {
  environment: "test" | "live";
  environmentLabel: string;
  connectionStatus: StripePlatformConnectionStatus;
  connectionStatusLabel: string;
  hasSecretKey: boolean;
  hasPublishableKey: boolean;
  hasWebhookSecret: boolean;
  secretKeyPrefix: string | null;
  publishableKeyPrefix: string | null;
  keysModeMatch: boolean;
  lastTestedAt: string | null;
  lastWebhookReceivedAt: string | null;
  platformFeePercent: number;
};

export type StripeConnectedProviderSummary = {
  providerId: string;
  clubName: string;
  stripeStatus: string;
};
