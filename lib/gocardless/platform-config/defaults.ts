import { UNIVERSAL_BOOKING_FEE_PERCENT } from "@/lib/fee-settings";
import type { GoCardlessPlatformConfigPayload } from "./types";

export const GOCARDLESS_PLATFORM_CONFIG_ID = 1;

export const DEFAULT_GOCARDLESS_PLATFORM_CONFIG: GoCardlessPlatformConfigPayload =
  {
    environment: "sandbox",
    accessToken: null,
    webhookSecret: null,
    clientId: null,
    clientSecret: null,
    redirectUri: null,
    callbackUri: null,
    platformEnabled: false,
    platformFeePercent: UNIVERSAL_BOOKING_FEE_PERCENT,
    connectionStatus: "not_configured",
    lastTestedAt: null,
    lastError: null,
    updatedAt: new Date().toISOString(),
  };

export const GOCARDLESS_CONNECTION_STATUS_LABELS: Record<
  GoCardlessPlatformConfigPayload["connectionStatus"],
  string
> = {
  not_configured: "Not configured",
  sandbox_connected: "Sandbox connected",
  live_connected: "Live connected",
  error: "Error",
};
