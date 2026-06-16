/**
 * Attempt to copy pk_test from Stripe CLI config into .env.local.
 * Never prints key values. Run: npm run sync:stripe-publishable
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { validateStripePublishableKey } from "../lib/stripe/env";

const ENV_PATH = join(process.cwd(), ".env.local");

function readStripeCliPublishableKey(): string | null {
  const candidates = [
    join(homedir(), ".config", "stripe", "config.toml"),
    join(homedir(), ".stripe", "config.toml"),
  ];

  for (const configPath of candidates) {
    if (!existsSync(configPath)) {
      continue;
    }

    const content = readFileSync(configPath, "utf8");
    const match =
      content.match(/test_mode_pub_key\s*=\s*"([^"]+)"/) ??
      content.match(/test_mode_pub_key\s*=\s*'([^']+)'/);

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function upsertEnvVar(content: string, name: string, value: string): string {
  const line = `${name}=${value}`;
  const pattern = new RegExp(`^${name}=.*$`, "m");

  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  const trimmed = content.replace(/\s*$/, "");
  const separator = trimmed.length > 0 ? "\n" : "";
  return `${trimmed}${separator}${line}\n`;
}

const cliKey = readStripeCliPublishableKey();

if (!cliKey) {
  console.error(
    "Could not find test_mode_pub_key in Stripe CLI config (~/.config/stripe/config.toml).",
  );
  console.error("");
  console.error(
    "Either run `stripe login` with the same account as your sk_test key, or paste pk_test_... manually:",
  );
  console.error(
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... in .env.local",
  );
  process.exit(1);
}

const validation = validateStripePublishableKey(cliKey);

if (!validation.valid) {
  console.error(validation.error ?? "Stripe CLI publishable key is invalid.");
  process.exit(1);
}

const existing = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : "";
const existingMatch = existing.match(
  /^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=(.*)$/m,
);
const existingValue = existingMatch?.[1]?.trim();

if (existingValue && validateStripePublishableKey(existingValue).valid) {
  console.log(
    "OK: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is already set in .env.local.",
  );
  process.exit(0);
}

const updated = upsertEnvVar(
  existing,
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  cliKey,
);
writeFileSync(ENV_PATH, updated, "utf8");

console.log(
  "Updated .env.local with NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY from Stripe CLI.",
);
console.log("Restart npm run dev, then run npm run check:stripe-env.");
