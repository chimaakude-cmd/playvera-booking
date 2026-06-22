export function buildGoCardlessConnectStartPath(providerId: string): string {
  const params = new URLSearchParams({
    providerId: providerId.trim(),
  });
  return `/api/gocardless/connect/start?${params.toString()}`;
}
