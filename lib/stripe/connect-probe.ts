import Stripe from "stripe";
import {
  getStripeConnectTechnicalMessage,
  isStripeConnectPlatformMisconfigured,
} from "./errors";
import { resolveStripeSecretKey, validateStripeSecretKey } from "./env";

export type StripeConnectProbeResult = {
  /** True when accounts.list succeeds without a Connect signup error. */
  connectApiReachable: boolean;
  /** Back-compat alias for connectApiReachable. */
  connectEnabled: boolean;
  secretKeyValid: boolean;
  message: string;
};

/** Read-only probe — accounts.list only; does not create accounts. */
export async function probeStripeConnectEnabled(): Promise<StripeConnectProbeResult> {
  const secretKey = resolveStripeSecretKey();
  const validation = validateStripeSecretKey(secretKey ?? undefined);

  if (!validation.valid) {
    return {
      connectApiReachable: false,
      connectEnabled: false,
      secretKeyValid: false,
      message: validation.error ?? "Invalid STRIPE_SECRET_KEY.",
    };
  }

  try {
    const stripe = new Stripe(secretKey!, { typescript: true });
    await stripe.accounts.list({ limit: 1 });

    return {
      connectApiReachable: true,
      connectEnabled: true,
      secretKeyValid: true,
      message:
        "Connect accounts API reachable (accounts.list). Express onboarding still requires Connect → Platform / Marketplace → Express · United Kingdom in Stripe Dashboard.",
    };
  } catch (error) {
    const message = getStripeConnectTechnicalMessage(error);
    const connectBlocked = isStripeConnectPlatformMisconfigured(error);

    return {
      connectApiReachable: false,
      connectEnabled: false,
      secretKeyValid: true,
      message: connectBlocked
        ? "Stripe Connect is not enabled on this platform account. Enable Express (UK) in Stripe Dashboard → Settings → Connect."
        : message,
    };
  }
}
