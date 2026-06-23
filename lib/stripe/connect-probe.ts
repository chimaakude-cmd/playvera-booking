import Stripe from "stripe";
import {
  getRawStripeErrorMessage,
  getStripeConnectTechnicalMessage,
  isStripeConnectPlatformMisconfigured,
  STRIPE_CONNECT_LOG_PREFIX,
} from "./errors";
import {
  resolveStripeModeFromSecretKey,
  resolveStripeSecretKey,
  validateStripeSecretKey,
} from "./env";

export type StripeConnectProbeResult = {
  /** True when accounts.list succeeds without a Connect signup error. */
  connectApiReachable: boolean;
  /** True when clubs may start Express onboarding (valid key, Connect not definitively disabled). */
  connectEnabled: boolean;
  /** True only when Stripe returns the definitive "signed up for Connect" platform error. */
  platformMisconfigured: boolean;
  secretKeyValid: boolean;
  message: string;
};

/** Read-only probe — accounts.list only; does not create accounts. */
export async function probeStripeConnectEnabled(
  secretKeyOverride?: string | null,
): Promise<StripeConnectProbeResult> {
  const secretKey = secretKeyOverride ?? resolveStripeSecretKey();
  const validation = validateStripeSecretKey(secretKey ?? undefined);
  const testMode = resolveStripeModeFromSecretKey(secretKey) === "test";

  console.log(STRIPE_CONNECT_LOG_PREFIX, {
    probe: "accounts.list",
    phase: "start",
    testMode,
    secretKeyValid: validation.valid,
  });

  if (!validation.valid) {
    const result = {
      connectApiReachable: false,
      connectEnabled: false,
      platformMisconfigured: true,
      secretKeyValid: false,
      message: validation.error ?? "Invalid STRIPE_SECRET_KEY.",
    };

    console.warn(STRIPE_CONNECT_LOG_PREFIX, {
      probe: "accounts.list",
      phase: "skipped",
      ...result,
    });

    return result;
  }

  try {
    const stripe = new Stripe(secretKey!, { typescript: true });
    await stripe.accounts.list({ limit: 1 });

    const result = {
      connectApiReachable: true,
      connectEnabled: true,
      platformMisconfigured: false,
      secretKeyValid: true,
      message: testMode
        ? "Connect accounts API reachable (test mode)."
        : "Connect accounts API reachable.",
    };

    console.log(STRIPE_CONNECT_LOG_PREFIX, {
      probe: "accounts.list",
      phase: "complete",
      testMode,
      ...result,
    });

    return result;
  } catch (error) {
    const message = getStripeConnectTechnicalMessage(error);
    const connectBlocked = isStripeConnectPlatformMisconfigured(error);

    if (connectBlocked) {
      const result = {
        connectApiReachable: false,
        connectEnabled: false,
        platformMisconfigured: true,
        secretKeyValid: true,
        message,
      };

      console.error(STRIPE_CONNECT_LOG_PREFIX, {
        probe: "accounts.list",
        phase: "failed",
        testMode,
        platformMisconfigured: true,
        message: getRawStripeErrorMessage(error),
      });

      return result;
    }

    // Probe failures that are not definitive Connect signup errors must not block clubs.
    // Sandbox/test keys should still allow Express onboarding attempts.
    console.warn(STRIPE_CONNECT_LOG_PREFIX, {
      probe: "accounts.list",
      phase: "inconclusive",
      testMode,
      message: getRawStripeErrorMessage(error),
    });

    return {
      connectApiReachable: false,
      connectEnabled: true,
      platformMisconfigured: false,
      secretKeyValid: true,
      message: testMode
        ? "Connect probe inconclusive in test mode — Express onboarding allowed."
        : "Connect probe inconclusive — onboarding allowed; verify Connect in Stripe Dashboard if onboarding fails.",
    };
  }
}
