import type { StripeMode } from "@/lib/stripe/env";
import type { StripePlatformConnectionStatus } from "./types";

const STATUS_LABELS: Record<StripePlatformConnectionStatus, string> = {
  not_configured: "Not configured",
  test_connected: "Test mode connected",
  live_connected: "Live mode connected",
  error: "Connection error",
};

export function stripeConnectionStatusLabel(
  status: StripePlatformConnectionStatus,
): string {
  return STATUS_LABELS[status];
}

/** Connection test passed for the active secret key mode. */
export function isStripePlatformConnectionVerified(
  status: StripePlatformConnectionStatus,
  keyMode: StripeMode | null = null,
): boolean {
  if (keyMode === "live") {
    return status === "live_connected";
  }
  if (keyMode === "test") {
    return status === "test_connected";
  }
  return status === "test_connected" || status === "live_connected";
}

export function resolveStripeConnectionStatusFromProbe(params: {
  secretKeyValid: boolean;
  connectEnabled: boolean;
  mode: "test" | "live" | null;
  existingStatus: StripePlatformConnectionStatus;
}): StripePlatformConnectionStatus {
  if (!params.secretKeyValid) {
    return "not_configured";
  }

  if (!params.connectEnabled) {
    return "error";
  }

  if (params.mode === "live") {
    return "live_connected";
  }

  if (params.mode === "test") {
    return "test_connected";
  }

  return params.existingStatus;
}
