export function buildBookingPath(sessionId: string, waitlist = false): string {
  return waitlist ? `/book/${sessionId}?waitlist=1` : `/book/${sessionId}`;
}

export function buildBookingReturnUrl(sessionId: string, waitlist = false): string {
  const path = buildBookingPath(sessionId, waitlist);
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}returnTo=${encodeURIComponent(path)}`;
}

export function buildParentLoginUrl(sessionId: string, waitlist = false): string {
  return `/parent/login?returnTo=${encodeURIComponent(buildBookingPath(sessionId, waitlist))}`;
}

export function buildParentSignupUrl(sessionId: string, waitlist = false): string {
  return `/parent/signup?returnTo=${encodeURIComponent(buildBookingPath(sessionId, waitlist))}`;
}

export function resolveSafeReturnPath(
  returnTo: string | null,
  fallback: string,
): string {
  if (!returnTo || !returnTo.startsWith("/")) {
    return fallback;
  }
  if (returnTo.startsWith("//")) {
    return fallback;
  }
  return returnTo;
}
