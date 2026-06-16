/**
 * Stripe Connect status mapping tests.
 * Run: npx tsx scripts/test-stripe-connect-status.ts
 */

import { resolveStripeConnectStatus } from "../lib/stripe/connect";
import {
  canUseBookkeepingIntegrations,
  type StripeConnectStatus,
} from "../lib/stripe-connect/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  resolveStripeConnectStatus(null) === "not_connected",
  "null account should be not_connected",
);

assert(
  resolveStripeConnectStatus({
    id: "acct_1",
    details_submitted: false,
    charges_enabled: false,
    payouts_enabled: false,
  } as never  ) === "action_required",
  "incomplete onboarding",
);

assert(
  resolveStripeConnectStatus({
    id: "acct_2",
    details_submitted: true,
    charges_enabled: true,
    payouts_enabled: false,
    requirements: { currently_due: [], past_due: [], disabled_reason: null },
  } as never) === "connected",
  "charges enabled without payouts",
);

assert(
  resolveStripeConnectStatus({
    id: "acct_3",
    details_submitted: true,
    charges_enabled: true,
    payouts_enabled: true,
    requirements: { currently_due: [], past_due: [], disabled_reason: null },
  } as never) === "payouts_enabled",
  "full payouts enabled",
);

assert(
  resolveStripeConnectStatus({
    id: "acct_4",
    details_submitted: true,
    charges_enabled: false,
    payouts_enabled: false,
    requirements: { disabled_reason: "requirements.past_due" },
  } as never) === "restricted",
  "disabled reason is restricted",
);

const bookkeepingCases: Array<[StripeConnectStatus, boolean]> = [
  ["not_connected", false],
  ["action_required", false],
  ["restricted", false],
  ["connected", true],
  ["payouts_enabled", true],
];

for (const [status, expected] of bookkeepingCases) {
  assert(
    canUseBookkeepingIntegrations(status) === expected,
    `bookkeeping lock for ${status}`,
  );
}

console.log("All Stripe Connect status tests passed.");
