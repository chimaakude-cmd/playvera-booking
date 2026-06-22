# Custom SMTP for Supabase Auth (Activora)

Send Supabase Authentication emails from **Activora**, not `noreply@mail.app.supabase.io`.

**Target sender:** `no-reply@activora.uk`  
**Display name:** `Activora`

## Why Resend (recommended)

| Provider | Pros | Cons |
|----------|------|------|
| **Resend** ✅ | Simple API & dashboard; strong DX; good deliverability; straightforward domain verification; generous free tier for transactional mail; works well with Supabase custom SMTP | Requires DNS setup on `activora.uk` |
| SendGrid | Mature, scalable | Heavier setup; legacy UI |
| Postmark | Excellent deliverability | Higher cost at scale; separate message streams |
| Amazon SES | Very cheap at volume | AWS complexity; slower to configure |
| Mailgun | Solid API | DNS and account verification can be fiddly |

**Recommendation:** Use **Resend** for Activora auth mail. It is the fastest path to `no-reply@activora.uk` with SPF/DKIM/DMARC, and Supabase documents custom SMTP without app code changes.

Alternatives are fine if you already have contracts or infra — the DNS and Supabase steps below are similar.

---

## Step 1 — Resend account and domain

1. Sign up at [resend.com](https://resend.com).
2. **Domains** → **Add domain** → enter `activora.uk`.
3. Resend shows DNS records to add (typically):
   - **SPF** — TXT on `@` or `send` subdomain (follow Resend’s exact host/name)
   - **DKIM** — CNAME records (often 3 entries)
   - Optional **MX** if Resend specifies it for the sending subdomain

4. In your DNS provider (Cloudflare, Route53, etc.), add each record exactly as shown.
5. Wait for verification (often minutes; up to 48h for DNS propagation).
6. Create an API key with **Sending access** (store securely — used once in Supabase, not in this repo).

### DMARC (recommended)

Add a TXT record on `_dmarc.activora.uk`:

```text
v=DMARC1; p=none; rua=mailto:dmarc@activora.uk; pct=100; adkim=s; aspf=s
```

After monitoring, tighten to `p=quarantine` or `p=reject`. Align SPF/DKIM with Resend’s sending domain first.

---

## Step 2 — Supabase custom SMTP

1. Supabase Dashboard → **Project Settings** → **Authentication** (or **Authentication** → **SMTP Settings**, depending on UI version).
2. Enable **Custom SMTP**.
3. Enter:

| Field | Value |
|-------|-------|
| Host | `smtp.resend.com` |
| Port | `465` (SSL) or `587` (TLS) — use what Supabase labels as secure |
| Username | `resend` |
| Password | Your Resend **API key** (Resend uses the API key as SMTP password) |
| Sender email | `no-reply@activora.uk` |
| Sender name | `Activora` |

4. Save and use **Send test email** if available.
5. Trigger a real magic link from the app and confirm:
   - From: `Activora <no-reply@activora.uk>`
   - Subject: `Sign in to Activora` (after applying [`templates/magic-link.html`](./templates/magic-link.html))
   - Message passes SPF/DKIM in Gmail “Show original”

---

## Step 3 — Auth URL configuration

**Authentication** → **URL Configuration**:

| Setting | Production example |
|---------|-------------------|
| Site URL | `https://activora.uk` |
| Redirect URLs | Include production app URLs for club, admin, and parent callbacks already used by the app |

`{{ .SiteURL }}` in email templates resolves from Site URL. Wrong Site URL breaks footer links and some redirect behaviour.

---

## Step 4 — Apply branded template

See [`templates/README.md`](./templates/README.md):

1. **Authentication** → **Email Templates** → **Magic Link**
2. Subject: `Sign in to Activora`
3. Body: paste `supabase/templates/magic-link.html`

---

## Environment notes

### Production

- Domain: `activora.uk` verified in Resend
- Sender: `no-reply@activora.uk`
- Supabase production project: custom SMTP + templates applied
- No Next.js env vars required for Supabase SMTP (credentials live in Supabase only)

### Preview / staging

Options:

1. **Same Resend domain** — add sender like `no-reply@staging.activora.uk` or use `no-reply@activora.uk` with a separate Supabase staging project (simplest for deliverability testing).
2. **Separate Supabase project** — duplicate SMTP + template steps; set staging Site URL (e.g. Vercel preview URL or `https://staging.activora.uk`).
3. **Default Supabase mail** — OK for internal QA only; emails will look generic and come from Supabase until templates are pasted.

Do not commit Resend API keys or SMTP passwords to the repository.

### Local development

- `supabase start` can use built-in Mailpit/Inbucket for capture without Resend.
- Optional: point local SMTP at Resend for end-to-end tests (use a dev API key with rate limits).

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Emails still from `@mail.app.supabase.io` | Custom SMTP not enabled or not saved |
| Gmail spam / “via resend.dev” | Domain not verified; SPF/DKIM missing or wrong |
| Broken logo in email | Logo URL must be public HTTPS (`https://activora.uk/branding/...`) |
| Link expired immediately | Corporate link scanner — see [Supabase prefetching docs](https://supabase.com/docs/guides/auth/auth-email-templates#email-prefetching) |
| Wrong portal after click | Redirect URLs / app auth — not SMTP or template (do not change templates for this) |

---

## Checklist

- [ ] `activora.uk` added and verified in Resend
- [ ] SPF, DKIM, and DMARC DNS records published
- [ ] Supabase custom SMTP enabled with `no-reply@activora.uk`
- [ ] Magic Link subject and HTML template applied
- [ ] Test magic link received and sign-in succeeds for club, admin, and parent flows
