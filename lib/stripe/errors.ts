/**
 * Map Stripe API errors to user-safe messages (never includes secrets).
 */
export function getStripeConnectErrorMessage(error: unknown): string {
  const message =
    error instanceof Error ? error.message : "Stripe Connect failed.";

  if (message.includes("signed up for Connect")) {
    return (
      "Stripe Connect is not enabled on your Stripe account yet. In Stripe Dashboard, open Connect, choose Platform / Marketplace, enable Express accounts for United Kingdom, then try again."
    );
  }

  if (message.includes("STRIPE_SECRET_KEY")) {
    return message;
  }

  return message;
}
