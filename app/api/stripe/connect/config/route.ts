import { NextResponse } from "next/server";
import { probeStripeConnectEnabled } from "@/lib/stripe/connect-probe";
import {
  isPublishableKeyConfigured,
  isSecretKeyConfigured,
  logStripeEnvWarnings,
  resolveStripeMode,
  resolveStripePublishableKey,
  resolveStripeSecretKey,
  validateStripeKeyModeMatch,
  validateStripePublishableKey,
  validateStripeSecretKey,
  type StripeMode,
} from "@/lib/stripe/env";
import { isStripeConnectAdminDebugEnabled } from "@/lib/stripe/errors";

export type StripeConnectConfigResponse = {
  serverConfigured: boolean;
  clientConfigured: boolean;
  connectReady: boolean;
  connectEnabled: boolean;
  platformUnavailable: boolean;
  mode: StripeMode | null;
  testModeOnly: boolean;
  /** Safe to expose — publishable keys are public by design */
  publishableKey: string | null;
  publishableKeySource: "next_public" | "server" | null;
  secretKeyPrefix: string | null;
  publishableKeyPrefix: string | null;
  validationErrors: string[];
  adminDetail?: string;
};

/** Public-safe Stripe readiness — never returns secret key values. */
export async function GET() {
  logStripeEnvWarnings();

  const secretValidation = validateStripeSecretKey(
    resolveStripeSecretKey() ?? undefined,
  );
  const publicEnvKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  const serverPubKey = process.env.STRIPE_PUBLISHABLE_KEY?.trim();
  const resolvedPublishable = resolveStripePublishableKey();
  const publishableValidation = validateStripePublishableKey(
    resolvedPublishable ?? undefined,
  );

  const validationErrors: string[] = [];
  if (!secretValidation.valid && secretValidation.error) {
    validationErrors.push(secretValidation.error);
  }
  if (!publishableValidation.valid && publishableValidation.error) {
    validationErrors.push(publishableValidation.error);
  }

  const modeMatch = validateStripeKeyModeMatch(
    resolveStripeSecretKey() ?? undefined,
    resolvedPublishable ?? undefined,
  );
  if (!modeMatch.valid && modeMatch.error) {
    validationErrors.push(modeMatch.error);
  }

  const mode = resolveStripeMode();

  let connectEnabled = false;
  let platformUnavailable = false;
  let adminDetail: string | undefined;

  if (secretValidation.valid) {
    const probe = await probeStripeConnectEnabled();
    connectEnabled = probe.connectEnabled;
    platformUnavailable = probe.platformMisconfigured;

    if (probe.platformMisconfigured) {
      if (isStripeConnectAdminDebugEnabled()) {
        validationErrors.push(probe.message);
        adminDetail = probe.message;
      }
    } else if (!probe.connectApiReachable && isStripeConnectAdminDebugEnabled()) {
      adminDetail = probe.message;
    }
  } else {
    platformUnavailable = true;
  }

  const publishableKeySource = publicEnvKey
    ? "next_public"
    : serverPubKey
      ? "server"
      : null;

  const response: StripeConnectConfigResponse = {
    serverConfigured: isSecretKeyConfigured(),
    clientConfigured: isPublishableKeyConfigured(),
    connectReady: secretValidation.valid && !platformUnavailable,
    connectEnabled,
    platformUnavailable,
    mode,
    testModeOnly: mode === "test",
    publishableKey: publishableValidation.valid ? resolvedPublishable : null,
    publishableKeySource,
    secretKeyPrefix: secretValidation.prefix ?? null,
    publishableKeyPrefix: publishableValidation.prefix ?? null,
    validationErrors,
    ...(adminDetail ? { adminDetail } : {}),
  };

  return NextResponse.json(response);
}
