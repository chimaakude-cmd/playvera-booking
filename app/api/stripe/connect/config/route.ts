import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { probeStripeConnectEnabled } from "@/lib/stripe/connect-probe";
import {
  logStripeEnvWarnings,
  validateStripeKeyModeMatch,
  validateStripePublishableKey,
  validateStripeSecretKey,
  type StripeMode,
} from "@/lib/stripe/env";
import {
  getResolvedStripeEnv,
  resolveStripePlatformConfig,
} from "@/lib/stripe/platform-admin/resolve";
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
  publishableKeySource: "next_public" | "server" | "database" | null;
  secretKeyPrefix: string | null;
  publishableKeyPrefix: string | null;
  validationErrors: string[];
  adminDetail?: string;
};

/** Public-safe Stripe readiness — never returns secret key values. */
export async function GET(request: Request) {
  logStripeEnvWarnings();

  const resolved = await getResolvedStripeEnv();
  const platform = await resolveStripePlatformConfig(request as NextRequest);
  const secretValidation = validateStripeSecretKey(
    resolved.secretKey ?? undefined,
  );
  const publishableValidation = validateStripePublishableKey(
    resolved.publishableKey ?? undefined,
  );

  const validationErrors: string[] = [];
  if (!secretValidation.valid && secretValidation.error) {
    validationErrors.push(secretValidation.error);
  }
  if (!publishableValidation.valid && publishableValidation.error) {
    validationErrors.push(publishableValidation.error);
  }

  const modeMatch = validateStripeKeyModeMatch(
    resolved.secretKey ?? undefined,
    resolved.publishableKey ?? undefined,
  );
  if (!modeMatch.valid && modeMatch.error) {
    validationErrors.push(modeMatch.error);
  }

  const mode = secretValidation.mode ?? resolved.environment;
  const stripeEnabled = secretValidation.valid;

  let connectProbe = {
    connectEnabled: false,
    platformMisconfigured: false,
    connectApiReachable: false,
    message: "",
  };
  let adminDetail: string | undefined;

  if (stripeEnabled) {
    connectProbe = await probeStripeConnectEnabled(resolved.secretKey);

    if (connectProbe.platformMisconfigured && isStripeConnectAdminDebugEnabled()) {
      validationErrors.push(connectProbe.message);
      adminDetail = connectProbe.message;
    } else if (
      !connectProbe.connectApiReachable &&
      isStripeConnectAdminDebugEnabled()
    ) {
      adminDetail = connectProbe.message;
    }
  }

  if (!platform.isClubConnectAvailable && isStripeConnectAdminDebugEnabled()) {
    const blocker = platform.clubConnectBlockers[0];
    if (blocker) {
      validationErrors.push(blocker);
      adminDetail = adminDetail ?? blocker;
    }
  }

  const connectEnabled =
    stripeEnabled && platform.isClubConnectAvailable && connectProbe.connectEnabled;
  const platformUnavailable = !platform.isClubConnectAvailable;

  console.log(STRIPE_CONNECT_LOG_PREFIX, {
    route: "/api/stripe/connect/config",
    stripe_enabled: stripeEnabled,
    connect_enabled: connectEnabled,
    connectReady: stripeEnabled,
    platformUnavailable,
    environment: mode,
  });

  const publicEnvKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  const serverPubKey = process.env.STRIPE_PUBLISHABLE_KEY?.trim();
  const publishableKeySource = publicEnvKey
    ? "next_public"
    : serverPubKey
      ? "server"
      : resolved.publishableKey
        ? "database"
        : null;

  const response: StripeConnectConfigResponse = {
    serverConfigured: secretValidation.valid && platform.isClubConnectAvailable,
    clientConfigured: publishableValidation.valid,
    connectReady: connectEnabled,
    connectEnabled,
    platformUnavailable,
    stripe_enabled: stripeEnabled,
    connect_enabled: connectEnabled,
    environment: mode,
    mode,
    testModeOnly: mode === "test",
    publishableKey: publishableValidation.valid ? resolved.publishableKey : null,
    publishableKeySource,
    secretKeyPrefix: secretValidation.prefix ?? null,
    publishableKeyPrefix: publishableValidation.prefix ?? null,
    validationErrors,
    ...(adminDetail ? { adminDetail } : {}),
  };

  return NextResponse.json(response);
}
