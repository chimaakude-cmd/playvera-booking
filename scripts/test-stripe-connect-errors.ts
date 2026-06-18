/**
 * Stripe Connect error mapping tests.
 * Run: npx tsx scripts/test-stripe-connect-errors.ts
 */

import {
  classifyStripeConnectError,
  getStripeConnectClubMessage,
  getStripeConnectTechnicalMessage,
  isStripeConnectPlatformMisconfigured,
} from "../lib/stripe/errors";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const platformError = new Error(
  "You can only create new accounts if you've signed up for Connect.",
);

assert(
  isStripeConnectPlatformMisconfigured(platformError),
  "platform misconfiguration should be detected",
);

assert(
  classifyStripeConnectError(platformError) === "platform_unavailable",
  "platform error should classify as platform_unavailable",
);

assert(
  getStripeConnectClubMessage(platformError).includes(
    "Payments setup is temporarily unavailable",
  ),
  "club message should be customer-facing",
);

assert(
  getStripeConnectTechnicalMessage(platformError).includes(
    "Stripe Connect is not enabled on this platform account",
  ),
  "technical message should include admin guidance",
);

assert(
  !getStripeConnectClubMessage(platformError).includes("Stripe Dashboard"),
  "club message must not mention Stripe Dashboard",
);

const transientError = new Error("Network timeout");

assert(
  classifyStripeConnectError(transientError) === "transient",
  "unknown errors should be transient",
);

assert(
  getStripeConnectClubMessage(transientError).includes("try again"),
  "transient club message should suggest retry",
);

console.log("All Stripe Connect error mapping tests passed.");
