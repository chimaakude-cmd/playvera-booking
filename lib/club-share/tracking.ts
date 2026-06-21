/**
 * Guards for public share analytics — excludes internal/preview traffic.
 */

export type ShareTrafficContext = {
  pathname?: string;
  hostname?: string;
  search?: string;
  referrer?: string;
};

const INTERNAL_PATH_PREFIXES = ["/club/", "/admin"] as const;

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

function readContext(): ShareTrafficContext {
  if (typeof window === "undefined") {
    return {};
  }

  return {
    pathname: window.location.pathname,
    hostname: window.location.hostname,
    search: window.location.search,
    referrer: document.referrer,
  };
}

function isLocalHost(hostname: string | undefined): boolean {
  if (!hostname) {
    return false;
  }

  const normalized = hostname.toLowerCase();
  return (
    LOCAL_HOSTNAMES.has(normalized) ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".localhost")
  );
}

function isInternalPath(pathname: string | undefined): boolean {
  if (!pathname) {
    return false;
  }

  return INTERNAL_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function hasInternalPreviewParams(search: string | undefined): boolean {
  if (!search) {
    return false;
  }

  const params = new URLSearchParams(search);
  return params.get("preview") === "1" || params.get("internal") === "1";
}

function isInternalReferrer(referrer: string | undefined): boolean {
  if (!referrer) {
    return false;
  }

  try {
    const refPath = new URL(referrer).pathname;
    return isInternalPath(refPath);
  } catch {
    return false;
  }
}

export function isInternalShareTraffic(
  context: ShareTrafficContext = readContext(),
): boolean {
  if (typeof window !== "undefined" && navigator.webdriver) {
    return true;
  }

  if (isLocalHost(context.hostname)) {
    return true;
  }

  if (isInternalPath(context.pathname)) {
    return true;
  }

  if (hasInternalPreviewParams(context.search)) {
    return true;
  }

  if (isInternalReferrer(context.referrer)) {
    return true;
  }

  return false;
}

export function shouldTrackPublicShareAnalytics(
  context: ShareTrafficContext = readContext(),
): boolean {
  return !isInternalShareTraffic(context);
}

/** Public arrival via shared link (not QR, not same-origin navigation). */
export function isPublicSharedLinkArrival(
  context: ShareTrafficContext = readContext(),
): boolean {
  if (isInternalShareTraffic(context)) {
    return false;
  }

  const params = new URLSearchParams(context.search ?? "");
  const src = params.get("src");

  if (src === "qr") {
    return false;
  }

  if (
    src ||
    params.get("utm_source") ||
    params.get("utm_medium") ||
    params.get("utm_campaign")
  ) {
    return true;
  }

  const referrer = context.referrer?.trim();
  if (!referrer) {
    return false;
  }

  try {
    const refOrigin = new URL(referrer).origin;
    const currentOrigin =
      typeof window !== "undefined" ? window.location.origin : "";
    return Boolean(currentOrigin && refOrigin !== currentOrigin);
  } catch {
    return false;
  }
}

export function logShareAnalyticsDebug(
  label: string,
  payload: Record<string, unknown>,
): void {
  if (typeof window === "undefined") {
    return;
  }

  console.log(`[share-analytics] ${label}`, {
    ...payload,
    timestamp: new Date().toISOString(),
  });
}
