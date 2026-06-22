# Activora auth email branding

Magic-link and other Supabase Auth emails should feel like Activora, not generic Supabase. This document summarises brand choices and links to template and SMTP setup guides.

**Out of scope:** auth routes, login flow, middleware, or confirmation URL construction. Templates only change how emails look and who they are sent from.

## Brand colors (from codebase)

| Token | Hex | Usage in magic-link email |
|-------|-----|---------------------------|
| `ACTIVORA_PRIMARY` | `#0F172A` | Outer background, security callout inner bg |
| Card surface | `#1E293B` | Main email card |
| Border / muted | `#334155`, `#475569`, `#64748B` | Card border, footer, secondary text |
| Body text | `#F8FAFC`, `#CBD5E1`, `#94A3B8` | Headings and copy |
| `ACTIVORA_ACTION` | `#F87128` | CTA button, accent border, links |
| `ACTIVORA_ACCENT` | `#9333EA` | Reserved for marketing gradients (not used in auth emails) |

Defined in `lib/home/constants.ts` and used across the product UI.

## Logo

Production URL (used in templates):

```text
https://activora.uk/branding/activora-logo-compact.png
```

Same asset as `public/branding/activora-logo-compact.png` (`BRAND_LOGO_COMPACT` in `lib/branding/constants.ts`). The app’s transactional email helper (`lib/branding/email-header.ts`) builds the same path relative to `NEXT_PUBLIC_APP_URL`.

## Template files

| Path | Description |
|------|-------------|
| `supabase/templates/magic-link.html` | Table-based HTML, inline styles, Outlook/Gmail/Apple Mail compatible |
| `supabase/templates/magic-link.txt` | Plain-text fallback |

Apply via Dashboard: see [`templates/README.md`](./templates/README.md).

## Why one universal magic-link template

Magic links are shared across club staff, admin, and parent portals. Redirect destination is determined by auth configuration and app code, not the email template. A single CTA label — **Sign in to Activora** — keeps the experience consistent; users already know which portal they requested from.

## Email prefetching (enterprise mail scanners)

Some corporate email systems prefetch links and can invalidate one-click magic links before the user clicks. Supabase documents mitigations in [Email prefetching](https://supabase.com/docs/guides/auth/auth-email-templates#email-prefetching). If you hit this in production, consider OTP (`{{ .Token }}`) or a landing page that wraps `{{ .ConfirmationURL }}` — that would be an auth UX change, not covered by these templates.

## Environments

| Environment | Supabase project | Notes |
|-------------|------------------|-------|
| Production | Activora production project | Apply templates + Resend SMTP; `Site URL` = `https://activora.uk` |
| Preview / staging | Separate project or branch DB | Re-apply the same template paste; use staging `Site URL` and optionally `mail@staging.activora.uk` sender |
| Local | `supabase start` + Mailpit | Optional `config.toml` `content_path`; no custom SMTP required |

No extra env vars are required for templates themselves. SMTP credentials are configured in the Supabase Dashboard (see [`SMTP_SETUP.md`](./SMTP_SETUP.md)), not in this Next.js app’s `.env.local`.
