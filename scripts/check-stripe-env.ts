/**
 * Verify Stripe env vars (test or live mode) without printing secret values.
 * Run: npm run check:stripe-env
 */

import { probeStripeConnectEnabled } from "../lib/stripe/connect-probe";
import {
  resolveStripeMode,
  resolveStripePublishableKey,
  resolveStripeSecretKey,
  validateStripeKeyModeMatch,
  validateStripePublishableKey,
  validateStripeSecretKey,
} from "../lib/stripe/env";

const optional = ["STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_APP_URL"] as const;

let failures = 0;

function pass(message: string) {
  console.log(`OK: ${message}`);
}

function fail(message: string) {
  console.error(`FAIL: ${message}`);
  failures += 1;
}

function warn(message: string) {
  console.warn(`WARN: ${message}`);
}

const secretKey = resolveStripeSecretKey();
const secretValidation = validateStripeSecretKey(secretKey ?? undefined);

if (secretValidation.valid) {
  pass(
    `STRIPE_SECRET_KEY prefix ${secretValidation.prefix} (${secretValidation.mode} mode)`,
  );
} else {
  fail(secretValidation.error ?? "STRIPE_SECRET_KEY is invalid.");
}

const publicEnvKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
const serverPubKey = process.env.STRIPE_PUBLISHABLE_KEY?.trim();
const resolvedPublishable = resolveStripePublishableKey();
const publishableValidation = validateStripePublishableKey(
  resolvedPublishable ?? undefined,
);

if (publishableValidation.valid) {
  const source = publicEnvKey
    ? "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    : "STRIPE_PUBLISHABLE_KEY (server fallback)";
  pass(
    `${source} prefix ${publishableValidation.prefix} (${publishableValidation.mode} mode)`,
  );
} else {
  fail(publishableValidation.error ?? "Publishable key is missing.");

  console.error("");
  console.error(
    "The publishable key cannot be derived from STRIPE_SECRET_KEY.",
  );
  console.error(
    "Paste pk_test_... or pk_live_... from Stripe Dashboard → Developers → API keys",
  );
  console.error(
    "into .env.local as NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)",
  );
  console.error("");
  console.error(
    "If you use Stripe CLI, run: npm run sync:stripe-publishable",
  );
  console.error(
    "(reads test_mode_pub_key from ~/.config/stripe/config.toml when available)",
  );
}

const modeMatch = validateStripeKeyModeMatch(
  secretKey ?? undefined,
  resolvedPublishable ?? undefined,
);
if (!modeMatch.valid && modeMatch.error) {
  fail(modeMatch.error);
}

if (publicEnvKey && serverPubKey && publicEnvKey !== serverPubKey) {
  warn(
    "Both NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and STRIPE_PUBLISHABLE_KEY are set but differ. NEXT_PUBLIC takes precedence.",
  );
}

for (const name of optional) {
  const value = process.env[name]?.trim();
  if (!value && name === "NEXT_PUBLIC_APP_URL") {
    warn(`${name} not set (defaults to request host in dev)`);
  } else if (value) {
    pass(`${name} is set`);
  } else {
    pass(`${name} is empty (optional)`);
  }
}

if (secretValidation.valid) {
  console.log("");
  console.log("Probing Stripe Connect (read-only accounts.list)…");

  void probeStripeConnectEnabled().then((probe) => {
    if (probe.connectApiReachable) {
      pass(probe.message);
    } else {
      fail(probe.message);
      console.error("");
      console.error(
        "Enable Connect in Stripe Dashboard: Settings → Connect → Platform / Marketplace → Express · United Kingdom.",
      );
    }

    finish();
  });
} else {
  finish();
}

function finish() {
  if (failures > 0) {
    console.error("");
    console.error(
      "Fix the issues above, then restart npm run dev (clear .next if env vars still look stale).",
    );
    process.exit(1);
  }

  console.log("");
  const mode = resolveStripeMode();
  console.log(
    `Stripe environment is ready for ${mode === "live" ? "LIVE" : "TEST"} mode Connect.`,
  );
}
