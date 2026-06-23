import type { NextRequest } from "next/server";
import { resolveServerAppBaseUrl } from "@/lib/app-url";
import { PLATFORM_FEE_PERCENT } from "@/lib/payments";
import { probeStripeConnectEnabled } from "@/lib/stripe/connect-probe";
import {
  isPublishableKeyConfigured,
  isSecretKeyConfigured,
  resolveStripeMode,
  resolveStripeModeFromPublishableKey,
  resolveStripeModeFromSecretKey,
  resolveStripePublishableKey,
  resolveStripeSecretKey,
  validateStripeKeyModeMatch,
  validateStripePublishableKey,
  validateStripeSecretKey,
} from "@/lib/stripe/env";
import {
  isStripePlatformConnectionVerified,
  stripeConnectionStatusLabel,
} from "./connection-status";
import { getServerStripePlatformState } from "./server-store";
import type { StripePlatformConfigPublic } from "./types";

export type ResolvedStripePlatformConfig = {
  environment: "test" | "live";
  environmentLabel: string;
  isPlatformConfigured: boolean;
  isClubConnectAvailable: boolean;
  isConnectionVerified: boolean;
  isWebhookConfigured: boolean;
  clubConnectBlockers: string[];
  webhookUri: string;
  platformFeePercent: number;
  public: StripePlatformConfigPublic;
};

function environmentLabel(mode: "test" | "live" | null): string {
  if (mode === "live") {
    return "Live";
  }
  if (mode === "test") {
    return "Test mode";
  }
  return "Unknown";
}

export async function resolveStripePlatformConfig(
  request: NextRequest,
): Promise<ResolvedStripePlatformConfig> {
  const secretKey = resolveStripeSecretKey();
  const publishableKey = resolveStripePublishableKey();
  const secretValidation = validateStripeSecretKey(secretKey ?? undefined);
  const publishableValidation = validateStripePublishableKey(
    publishableKey ?? undefined,
  );
  const modeMatch = validateStripeKeyModeMatch(
    secretKey ?? undefined,
    publishableKey ?? undefined,
  );
  const mode = resolveStripeMode();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  const state = await getServerStripePlatformState();
  const baseUrl = resolveServerAppBaseUrl(request);

  const clubConnectBlockers: string[] = [];

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
  if (!webhookSecret) {
    clubConnectBlockers.push("Set STRIPE_WEBHOOK_SECRET for webhook verification.");
  }

  let connectionStatus = state.connectionStatus;
  if (
    secretValidation.valid &&
    publishableValidation.valid &&
    modeMatch.valid &&
    !isStripePlatformConnectionVerified(connectionStatus)
  ) {
    const probe = await probeStripeConnectEnabled();
    if (probe.connectEnabled && mode) {
      connectionStatus =
        mode === "live" ? "live_connected" : "test_connected";
    } else if (probe.platformMisconfigured) {
      connectionStatus = "error";
      clubConnectBlockers.push(
        "Enable Stripe Connect (Express, UK) in Stripe Dashboard.",
      );
    }
  }

  const isPlatformConfigured =
    isSecretKeyConfigured() && isPublishableKeyConfigured();
  const isWebhookConfigured = webhookSecret.length > 0;
  const isConnectionVerified = isStripePlatformConnectionVerified(connectionStatus);
  const isClubConnectAvailable =
    isPlatformConfigured &&
    modeMatch.valid &&
    isConnectionVerified &&
    !clubConnectBlockers.some((blocker) =>
      blocker.includes("Enable Stripe Connect"),
    );

  if (isPlatformConfigured && !isConnectionVerified) {
    clubConnectBlockers.push("Run Test connection to verify Stripe Connect.");
  }

  const publicConfig: StripePlatformConfigPublic = {
    environment: mode ?? "test",
    environmentLabel: environmentLabel(mode),
    connectionStatus,
    connectionStatusLabel: stripeConnectionStatusLabel(connectionStatus),
    hasSecretKey: secretValidation.valid,
    hasPublishableKey: publishableValidation.valid,
    hasWebhookSecret: isWebhookConfigured,
    secretKeyPrefix: secretValidation.prefix ?? null,
    publishableKeyPrefix: publishableValidation.prefix ?? null,
    keysModeMatch: modeMatch.valid,
    lastTestedAt: state.lastTestedAt,
    lastWebhookReceivedAt: state.lastWebhookReceivedAt,
    platformFeePercent: PLATFORM_FEE_PERCENT,
  };

  return {
    environment: mode ?? "test",
    environmentLabel: environmentLabel(mode),
    isPlatformConfigured,
    isClubConnectAvailable,
    isConnectionVerified,
    isWebhookConfigured,
    clubConnectBlockers,
    webhookUri: `${baseUrl}/api/stripe/webhook`,
    platformFeePercent: PLATFORM_FEE_PERCENT,
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

export function resolveStripePublishableMode(): "test" | "live" | null {
  return resolveStripeModeFromPublishableKey(resolveStripePublishableKey());
}

export function resolveStripeSecretMode(): "test" | "live" | null {
  return resolveStripeModeFromSecretKey(resolveStripeSecretKey());
}
