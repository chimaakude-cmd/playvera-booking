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
import {
  isStripeConnectAdminDebugEnabled,
  STRIPE_CONNECT_LOG_PREFIX,
} from "@/lib/stripe/errors";

export type StripeConnectConfigResponse = {
  serverConfigured: boolean;
  clientConfigured: boolean;
  connectReady: boolean;
  connectEnabled: boolean;
  platformUnavailable: boolean;
  stripe_enabled: boolean;
  connect_enabled: boolean;
  environment: StripeMode | null;
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
  const stripeEnabled = secretValidation.valid;

  let connectEnabled = stripeEnabled;
  let adminDetail: string | undefined;

  if (stripeEnabled) {
    const probe = await probeStripeConnectEnabled();
    connectEnabled = probe.connectEnabled;

    if (probe.platformMisconfigured && isStripeConnectAdminDebugEnabled()) {
      validationErrors.push(probe.message);
      adminDetail = probe.message;
    } else if (!probe.connectApiReachable && isStripeConnectAdminDebugEnabled()) {
      adminDetail = probe.message;
    }
  }

  // Only block onboarding when STRIPE_SECRET_KEY is missing or invalid.
  const platformUnavailable = !stripeEnabled;

  console.log(STRIPE_CONNECT_LOG_PREFIX, {
    route: "/api/stripe/connect/config",
    stripe_enabled: stripeEnabled,
    connect_enabled: connectEnabled,
    connectReady: stripeEnabled,
    platformUnavailable,
    environment: mode,
  });

  const publishableKeySource = publicEnvKey
    ? "next_public"
    : serverPubKey
      ? "server"
      : null;

  const response: StripeConnectConfigResponse = {
    serverConfigured: isSecretKeyConfigured(),
    clientConfigured: isPublishableKeyConfigured(),
    connectReady: stripeEnabled,
    connectEnabled,
    platformUnavailable,
    stripe_enabled: stripeEnabled,
    connect_enabled: connectEnabled,
    environment: mode,
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
