import { resolveServerAppBaseUrl } from "@/lib/app-url";
import { BRAND_LOGO_COMPACT } from "@/lib/branding/constants";
import { BRAND_NAME } from "@/lib/brand";

/**
 * Absolute logo URL for HTML emails. Set NEXT_PUBLIC_APP_URL in production.
 */
export function getBrandLogoEmailUrl(): string {
  const base = resolveServerAppBaseUrl();
  return `${base}${BRAND_LOGO_COMPACT}`;
}

/** Centred logo block for transactional email HTML. */
export function buildEmailLogoHeaderHtml(logoUrl?: string): string {
  const src = logoUrl ?? getBrandLogoEmailUrl();
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 auto 24px auto;">
  <tr>
    <td align="center">
      <img
        src="${src}"
        alt="${BRAND_NAME}"
        width="220"
        height="100"
        style="display:block;height:auto;max-width:220px;width:100%;border:0;"
      />
    </td>
  </tr>
</table>`.trim();
}
