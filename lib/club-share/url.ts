import { getClientAppBaseUrl } from "@/lib/club-widget/embed";

function buildPublicUrl(
  path: string,
  options?: { forQr?: boolean; baseUrl?: string },
): string {
  const origin = options?.baseUrl ?? getClientAppBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${origin}${normalizedPath}`;
  if (options?.forQr) {
    return `${url}?src=qr`;
  }
  return url;
}

export function getClubPublicUrl(
  slug: string,
  options?: { forQr?: boolean; baseUrl?: string },
): string {
  const trimmedSlug = slug.trim();
  if (!trimmedSlug) {
    return buildPublicUrl("/clubs", options);
  }
  return buildPublicUrl(`/clubs/${encodeURIComponent(trimmedSlug)}`, options);
}

export function getActivityPublicUrl(
  activityId: string,
  options?: { forQr?: boolean; baseUrl?: string },
): string {
  const trimmedId = activityId.trim();
  if (!trimmedId) {
    return buildPublicUrl("/sessions", options);
  }
  return buildPublicUrl(`/book/${encodeURIComponent(trimmedId)}`, options);
}

export function getShortDisplayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
}
