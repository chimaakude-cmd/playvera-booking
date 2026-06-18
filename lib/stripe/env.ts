/**
 * Stripe environment validation (test or live mode via key prefix).
 * Never logs full key values.
 */

export type StripeMode = "test" | "live";

export type StripeKeyValidation = {
  valid: boolean;
  error?: string;
  prefix?: string;
  mode?: StripeMode;
};

export function resolveStripeModeFromSecretKey(
  value: string | null | undefined,
): StripeMode | null {
  const key = value?.trim() ?? "";
  if (key.startsWith("sk_test_")) {
    return "test";
  }
  if (key.startsWith("sk_live_")) {
    return "live";
  }
  return null;
}

export function resolveStripeModeFromPublishableKey(
  value: string | null | undefined,
): StripeMode | null {
  const key = value?.trim() ?? "";
  if (key.startsWith("pk_test_")) {
    return "test";
  }
  if (key.startsWith("pk_live_")) {
    return "live";
  }
  return null;
}

/** Active mode from STRIPE_SECRET_KEY, or null if unset/invalid. */
export function resolveStripeMode(): StripeMode | null {
  return resolveStripeModeFromSecretKey(resolveStripeSecretKey());
}

export function validateStripeSecretKey(value: string | undefined): StripeKeyValidation {
  const key = value?.trim() ?? "";

  if (!key) {
    return { valid: false, error: "STRIPE_SECRET_KEY is missing." };
  }

  if (key.startsWith("rk_test_") || key.startsWith("rk_live_")) {
    return {
      valid: false,
      error:
        "Use a standard secret key (sk_test_... or sk_live_...), not a restricted key (rk_...).",
    };
  }

  const mode = resolveStripeModeFromSecretKey(key);
  if (!mode) {
    return {
      valid: false,
      error: "STRIPE_SECRET_KEY must start with sk_test_ or sk_live_.",
    };
  }

  return { valid: true, prefix: key.slice(0, 12) + "...", mode };
}

export function validateStripePublishableKey(
  value: string | undefined,
): StripeKeyValidation {
  const key = value?.trim() ?? "";

  if (!key) {
    return { valid: false, error: "Publishable key is missing." };
  }

  if (key.startsWith("rk_test_") || key.startsWith("rk_live_")) {
    return {
      valid: false,
      error:
        "Use a standard publishable key (pk_test_... or pk_live_...), not a restricted key.",
    };
  }

  const mode = resolveStripeModeFromPublishableKey(key);
  if (!mode) {
    return {
      valid: false,
      error: "Publishable key must start with pk_test_ or pk_live_.",
    };
  }

  return { valid: true, prefix: key.slice(0, 12) + "...", mode };
}

/** Ensures secret and publishable keys are both test or both live. */
export function validateStripeKeyModeMatch(
  secretKey: string | undefined,
  publishableKey: string | undefined,
): { valid: boolean; error?: string } {
  const secretMode = resolveStripeModeFromSecretKey(secretKey);
  const publishableMode = resolveStripeModeFromPublishableKey(publishableKey);

  if (!secretMode || !publishableMode) {
    return { valid: true };
  }

  if (secretMode !== publishableMode) {
    return {
      valid: false,
      error: `Key mode mismatch: secret is ${secretMode} but publishable is ${publishableMode}. Use matching test or live keys.`,
    };
  }

  return { valid: true };
}

export function resolveStripePublishableKey(): string | null {
  const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  if (publicKey) {
    return publicKey;
  }

  const serverKey = process.env.STRIPE_PUBLISHABLE_KEY?.trim();
  if (serverKey) {
    return serverKey;
  }

  return null;
}

export function resolveStripeSecretKey(): string | null {
  return process.env.STRIPE_SECRET_KEY?.trim() ?? null;
}

export function isPublishableKeyConfigured(): boolean {
  const key = resolveStripePublishableKey();
  return key ? validateStripePublishableKey(key).valid : false;
}

export function isSecretKeyConfigured(): boolean {
  const key = resolveStripeSecretKey();
  return key ? validateStripeSecretKey(key).valid : false;
}

/** Log non-fatal Stripe env warnings (mixed test/live keys, etc.). */
export function logStripeEnvWarnings(): void {
  const secretKey = resolveStripeSecretKey();
  const publishableKey = resolveStripePublishableKey();
  const modeMatch = validateStripeKeyModeMatch(
    secretKey ?? undefined,
    publishableKey ?? undefined,
  );

  if (!modeMatch.valid && modeMatch.error) {
    console.warn("[stripe]", modeMatch.error);
  }
}
