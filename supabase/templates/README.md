# Supabase Auth email templates

Branded HTML and plain-text templates for Supabase Authentication emails. These files are **reference copies** for the Supabase Dashboard — Supabase does not read them from this repo automatically unless you configure local dev via `config.toml`.

## Magic Link template

| File | Purpose |
|------|---------|
| [`magic-link.html`](./magic-link.html) | Branded HTML body (dark theme, Activora logo, orange CTA) |
| [`magic-link.txt`](./magic-link.txt) | Plain-text fallback for clients that do not render HTML |

One universal template covers club, admin, and parent portal magic-link sign-in. Auth logic and redirect targets are unchanged; only the email appearance is customised.

### Recommended subject line

In the dashboard, set the Magic Link **Subject** to:

```text
Sign in to Activora
```

(Default Supabase subject is "Magic Link" or "Your Magic Link".)

### Template variables used

These are [Supabase Go-template variables](https://supabase.com/docs/guides/auth/auth-email-templates):

| Variable | Usage in template |
|----------|-------------------|
| `{{ .ConfirmationURL }}` | Primary sign-in link (button + fallback URL) |
| `{{ .Email }}` | Recipient email shown in the security notice |
| `{{ .SiteURL }}` | Site URL from Auth URL configuration (footer link) |

Other available variables (not used here): `{{ .Token }}`, `{{ .TokenHash }}`, `{{ .RedirectTo }}`.

**Do not** hardcode confirmation URLs. Always use `{{ .ConfirmationURL }}`.

### Brand assets

- Logo: `https://activora.uk/branding/activora-logo-compact.png` (matches `public/branding/activora-logo-compact.png` and `lib/branding/constants.ts`)
- Colors: see [`AUTH_EMAIL_BRANDING.md`](../AUTH_EMAIL_BRANDING.md)

---

## Apply in Supabase Dashboard (production)

1. Open **[Supabase Dashboard](https://supabase.com/dashboard)** → your Activora project.
2. Go to **Authentication** → **Email Templates**.
3. Select **Magic Link**.
4. Set **Subject** to `Sign in to Activora`.
5. Open [`magic-link.html`](./magic-link.html) in this repo, copy the **entire file**, and paste into the **Message body** (HTML) field.
6. If the dashboard has a separate plain-text field, paste [`magic-link.txt`](./magic-link.txt) there. (Some projects use HTML-only; plain text is optional but improves deliverability.)
7. Click **Save**.
8. Send a test magic link from your app (club login, admin login, or parent login) and verify:
   - From name/address matches your SMTP setup (see [`SMTP_SETUP.md`](../SMTP_SETUP.md))
   - Logo loads over HTTPS
   - Button opens the correct portal after sign-in
   - Footer shows the expected `Site URL`

Repeat for **preview/staging** Supabase projects if you use separate Auth projects per environment.

### Local development (optional)

To use these templates with `supabase start`, add to `supabase/config.toml`:

```toml
[auth.email.template.magic_link]
subject = "Sign in to Activora"
content_path = "./supabase/templates/magic-link.html"
```

Plain-text local templates may require a separate config key depending on your CLI version; the dashboard paste flow above is the primary path for hosted projects.

---

## Related docs

- [Custom SMTP with Resend](../SMTP_SETUP.md) — send from `no-reply@activora.uk`
- [Auth email branding overview](../AUTH_EMAIL_BRANDING.md) — colors, rationale, environment notes
