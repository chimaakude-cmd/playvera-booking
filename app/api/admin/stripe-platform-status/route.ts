import { NextResponse } from "next/server";
import { probeStripeConnectEnabled } from "@/lib/stripe/connect-probe";
import {
  resolveStripeModeFromPublishableKey,
  resolveStripeModeFromSecretKey,
  validateStripePublishableKey,
  validateStripeSecretKey,
  validateStripeWebhookSecret,
  type StripeMode,
} from "@/lib/stripe/env";
import { getResolvedStripeEnv } from "@/lib/stripe/platform-admin/resolve";

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
  const resolved = await getResolvedStripeEnv();
  const secretValidation = validateStripeSecretKey(resolved.secretKey ?? undefined);
  const publishableValidation = validateStripePublishableKey(
    resolved.publishableKey ?? undefined,
  );
  const webhookValidation = validateStripeWebhookSecret(
    resolved.webhookSecret ?? undefined,
  );

  let connectStatus: AdminStripePlatformStatus["connect"] = {
    status: "unknown",
    ready: false,
  };

  if (secretValidation.valid) {
    const probe = await probeStripeConnectEnabled(resolved.secretKey);
    connectStatus = {
      status: probe.platformMisconfigured ? "disabled" : "enabled",
      ready: secretValidation.valid && !probe.platformMisconfigured,
    };
  }

  const response: AdminStripePlatformStatus = {
    secretKey: {
      status: secretValidation.valid ? "set" : "missing",
      mode: resolveStripeModeFromSecretKey(resolved.secretKey),
      prefix: secretValidation.prefix ?? null,
    },
    publishableKey: {
      status: publishableValidation.valid ? "set" : "missing",
      mode: resolveStripeModeFromPublishableKey(resolved.publishableKey),
      prefix: publishableValidation.prefix ?? null,
    },
    webhook: {
      status: webhookValidation.valid ? "set" : "missing",
    },
    connect: connectStatus,
    platform: {
      country: "GB",
      accountType: "express",
    },
  };

  return NextResponse.json(response);
}
