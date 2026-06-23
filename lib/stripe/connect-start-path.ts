export function buildStripeConnectStartPath(providerId: string): string {
  const params = new URLSearchParams({
    providerId: providerId.trim(),
  });
  return `/api/stripe/connect/start?${params.toString()}`;
}
