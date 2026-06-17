/** Canonical production origin for Activora (apex domain). */
export const PRODUCTION_APP_ORIGIN = "https://activora.uk";

/** Local development default. */
export const LOCAL_APP_ORIGIN = "http://localhost:3000";

/** Deprecated staging hostname — normalize to production apex. */
const LEGACY_APP_ORIGIN = "https://app.activora.uk";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

/** Map legacy app.activora.uk to activora.uk so invite/email links stay valid. */
export function normalizeAppOrigin(url: string): string {
  const trimmed = stripTrailingSlash(url.trim());
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname === "app.activora.uk") {
      return PRODUCTION_APP_ORIGIN;
    }
  } catch {
    if (trimmed === LEGACY_APP_ORIGIN) {
      return PRODUCTION_APP_ORIGIN;
    }
  }
  return trimmed;
}

/** Server-side app origin (API routes, emails, invite links). */
export function resolveServerAppBaseUrl(request?: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) {
    return normalizeAppOrigin(envUrl);
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//, "");
    return normalizeAppOrigin(`https://${host}`);
  }

  if (request) {
    const url = new URL(request.url);
    return normalizeAppOrigin(`${url.protocol}//${url.host}`);
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_APP_ORIGIN;
  }

  return LOCAL_APP_ORIGIN;
}

/** Client-side app origin (embed codes, share URLs, browser fallbacks). */
export function resolveClientAppBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) {
    return normalizeAppOrigin(envUrl);
  }

  if (typeof window !== "undefined") {
    return normalizeAppOrigin(window.location.origin);
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_APP_ORIGIN;
  }

  return LOCAL_APP_ORIGIN;
}

/** Request-aware server helper (Stripe/GoCardless redirects, waitlist emails). */
export function getAppBaseUrl(request: Request): string {
  return resolveServerAppBaseUrl(request);
}
