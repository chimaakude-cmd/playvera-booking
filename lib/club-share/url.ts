import { getClientAppBaseUrl } from "@/lib/club-widget/embed";

export function getClubPublicUrl(
  slug: string,
  options?: { forQr?: boolean; baseUrl?: string },
): string {
  const origin = options?.baseUrl ?? getClientAppBaseUrl();
  const url = `${origin}/clubs/${slug}`;
  if (options?.forQr) {
    return `${url}?src=qr`;
  }
  return url;
}

export function getShortDisplayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
}
