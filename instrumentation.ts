export async function register() {
  const { logStripeEnvWarnings } = await import("@/lib/stripe/env");
  logStripeEnvWarnings();
}
