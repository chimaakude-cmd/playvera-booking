import { UNIVERSAL_BOOKING_FEE_PERCENT } from "@/lib/fee-settings";
import type { StripePlatformConfigPayload } from "./types";

export const STRIPE_PLATFORM_CONFIG_ID = 1;

/** @deprecated Use STRIPE_PLATFORM_CONFIG_ID */
export const STRIPE_PLATFORM_STATE_ID = STRIPE_PLATFORM_CONFIG_ID;

export const DEFAULT_STRIPE_PLATFORM_CONFIG: StripePlatformConfigPayload = {
  environment: "test",
  secretKey: null,
  publishableKey: null,
  webhookSecret: null,
  platformEnabled: false,
  platformFeePercent: UNIVERSAL_BOOKING_FEE_PERCENT,
  connectionStatus: "not_configured",
  lastTestedAt: null,
  lastError: null,
  lastWebhookReceivedAt: null,
  updatedAt: new Date().toISOString(),
};

export const STRIPE_CONNECTION_STATUS_LABELS: Record<
  StripePlatformConfigPayload["connectionStatus"],
  string
> = {
  not_configured: "Not configured",
  test_connected: "Test mode connected",
  live_connected: "Live mode connected",
  error: "Connection error",
};
