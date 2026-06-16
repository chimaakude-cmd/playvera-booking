import { NextResponse } from "next/server";
import { probeStripeConnectEnabled } from "@/lib/stripe/connect-probe";
import {
  isPublishableKeyConfigured,
  isSecretKeyConfigured,
  resolveStripeModeFromPublishableKey,
  resolveStripeModeFromSecretKey,
  resolveStripePublishableKey,
  resolveStripeSecretKey,
  validateStripePublishableKey,
  validateStripeSecretKey,
  type StripeMode,
} from "@/lib/stripe/env";

export type AdminStripePlatformStatus = {
  secretKey: {
    status: "set" | "missing";
    mode: "test" | "live" | null;
    prefix: string | null;
  };
  publishableKey: {
    status: "set" | "missing";
    mode: StripeMode | null;
    prefix: string | null;
  };
  webhook: {
    status: "set" | "missing";
  };
  connect: {
    status: "enabled" | "disabled" | "unknown";
    ready: boolean;
  };
  platform: {
    country: "GB";
    accountType: "express";
  };
};

/** Safe platform Stripe status for admin UI — never returns secret values. */
export async function GET() {
  const secretKey = resolveStripeSecretKey();
  const secretValidation = validateStripeSecretKey(secretKey ?? undefined);
  const publishableKey = resolveStripePublishableKey();
  const publishableValidation = validateStripePublishableKey(
    publishableKey ?? undefined,
  );
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";

  let connectStatus: AdminStripePlatformStatus["connect"] = {
    status: "unknown",
    ready: false,
  };

  if (secretValidation.valid) {
    const probe = await probeStripeConnectEnabled();
    connectStatus = {
      status: probe.connectEnabled ? "enabled" : "disabled",
      ready: isSecretKeyConfigured() && probe.connectEnabled,
    };
  }

  const response: AdminStripePlatformStatus = {
    secretKey: {
      status: secretValidation.valid ? "set" : "missing",
      mode: resolveStripeModeFromSecretKey(secretKey),
      prefix: secretValidation.prefix ?? null,
    },
    publishableKey: {
      status: publishableValidation.valid ? "set" : "missing",
      mode: resolveStripeModeFromPublishableKey(publishableKey),
      prefix: publishableValidation.prefix ?? null,
    },
    webhook: {
      status: webhookSecret.length > 0 ? "set" : "missing",
    },
    connect: connectStatus,
    platform: {
      country: "GB",
      accountType: "express",
    },
  };

  return NextResponse.json(response);
}
