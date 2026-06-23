import type { StripePlatformStatePayload } from "./types";

export const STRIPE_PLATFORM_STATE_ID = 1;

export const DEFAULT_STRIPE_PLATFORM_STATE: StripePlatformStatePayload = {
  connectionStatus: "not_configured",
  lastTestedAt: null,
  lastError: null,
  lastWebhookReceivedAt: null,
};
