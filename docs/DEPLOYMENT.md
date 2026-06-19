# Deployment guide — Playvera Booking (Next.js 16)

This app runs as a **self-hosted Node.js** production server (`next build` + `next start`). There is no Vercel, Docker, or GitHub Actions config in this repo — you deploy by building on the server (or locally) and restarting the Node process.

**Production domain:** `activora.uk` (DNS on **Fasthosts Advanced DNS**).

---

## Hosting model

| Component | How it runs |
|-----------|-------------|
| **App server** | Node.js 20+ running `npm run start` (`next start`, default port 3000) |
| **Reverse proxy** | Your server’s nginx/Caddy/Apache terminates HTTPS and proxies to `localhost:3000` |
| **DNS** | Fasthosts Advanced DNS — apex `activora.uk` and `www.activora.uk` point to your server IP |
| **Database / auth** | Supabase (hosted separately) |
| **Payments** | Stripe Connect + GoCardless (API keys in server env) |

There is no platform-managed deploy. After pushing to `main`, **you must redeploy on the server yourself** (see [Production redeploy](#production-redeploy-you-must-do-this)).

---

## Build verification (run before every deploy)

```bash
npm ci          # or npm install
npm run typecheck
npm run lint
npm run build
npm run start   # optional smoke test on http://localhost:3000
```

**Expected:** `next build` completes with `✓ Compiled successfully` and lists App + API routes. The build also reports `✓ Proxy (Middleware)` from root `proxy.ts`.

**Stripe env sanity check:**

```bash
npm run check:stripe-env
```

---

## Production redeploy (you must do this)

After merging or pushing to `main`, SSH into your production server and run:

```bash
cd /path/to/playvera-booking   # your clone path on the server

git pull origin main

# Ensure production env vars are set (see below) BEFORE building
# NEXT_PUBLIC_* vars must exist before npm run build

npm ci
npm run build
```

Restart the Node process (use whichever you already run on the server):

```bash
# PM2 example
pm2 restart playvera-booking

# systemd example
sudo systemctl restart playvera-booking

# manual (not recommended for production)
npm run start
```

**Important:**

- Set or update environment variables on the server **before** `npm run build`.
- `NEXT_PUBLIC_*` variables are inlined at **build time** — changing them requires a new build and restart.
- Server-only vars (`STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, etc.) take effect on process restart; no rebuild needed unless you also changed `NEXT_PUBLIC_*`.

### First-time server setup

1. Install Node.js 20+ on the server.
2. Clone the repo: `git clone <repo-url> && cd playvera-booking`.
3. Copy `.env.local.example` → `.env.local` (or export vars via systemd/PM2 env file).
4. Fill in all production values (see [Environment variables](#environment-variables)).
5. `npm ci && npm run build`.
6. Run behind a reverse proxy with TLS (Let’s Encrypt or your host’s certificate).
7. Point Fasthosts DNS A records at this server’s public IP (see [DNS](#dns-fasthosts--activorauk)).

---

## Stripe environment verification (production)

These rules apply on your **production server**, not just locally.

### Sandbox / test mode (current production setup)

| Variable | Requirement |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Must be `sk_test_...` from the Stripe account where **Connect is enabled** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Must be `pk_test_...` from the **same** Stripe account |
| `STRIPE_WEBHOOK_SECRET` | Must be `whsec_...` from a webhook endpoint on the **same** test-mode account |

### Key rules

1. **Do not mix live and test keys.** Secret and publishable keys must both be test (`sk_test_` + `pk_test_`) or both live (`sk_live_` + `pk_live_`).
2. **`STRIPE_SECRET_KEY` is server-only.** Loaded at runtime by API routes (`lib/stripe/server.ts`). Never expose it to the browser.
3. **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is build-time.** Inlined into the client bundle during `npm run build`. Must be set in the server environment **before** you run `npm run build`.
4. **Both keys must be set before build/redeploy.** If you add or change either key, update the server env, run `npm run build`, and restart the process.
5. **Connect must be enabled** on that Stripe account (Dashboard → Settings → Connect). Use the same account for both keys.

### Verify before go-live

On the server (with production env loaded):

```bash
npm run check:stripe-env
```

At runtime, mixed-key warnings are logged on server startup via `instrumentation.ts` → `logStripeEnvWarnings()` (prefix `[stripe]`). The Connect config endpoint (`GET /api/stripe/connect/config`) also calls this check.

### When switching to live payments

Replace **all** Stripe vars together: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET`. Rebuild, restart, and register a new production webhook URL in Stripe Dashboard.

---

## Environment variables

Copy from `.env.local.example`. Set on the production server (`.env.local`, PM2 ecosystem file, or systemd `EnvironmentFile`).

### Required for core app

| Variable | Example / notes | Exposed to browser |
|----------|-----------------|-------------------|
| `NEXT_PUBLIC_APP_URL` | `https://activora.uk` | Yes (build time) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; Admin Users API | No |
| `NEXT_PUBLIC_DATA_PROVIDER` | `supabase` | Yes |
| `NEXT_PUBLIC_IMAGE_STORAGE_PROVIDER` | `supabase` | Yes |

Set `NEXT_PUBLIC_APP_URL` to your canonical production URL:

```
https://activora.uk
```

### Stripe Connect

| Variable | Example / notes | Exposed to browser |
|----------|-----------------|-------------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` | No |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` or `pk_live_...` | Yes (build time) |
| `STRIPE_PUBLISHABLE_KEY` | Optional server fallback | No |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | No |

See [Stripe environment verification](#stripe-environment-verification-production) above.

### GoCardless (provider subscriptions)

| Variable | Example / notes | Exposed to browser |
|----------|-----------------|-------------------|
| `GOCARDLESS_ACCESS_TOKEN` | Live or sandbox token | No |
| `GOCARDLESS_ENVIRONMENT` | `live` or `sandbox` | No |
| `GOCARDLESS_WEBHOOK_SECRET` | From GoCardless dashboard | No |

### Maps, address lookup, email

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Session search map |
| `GETADDRESS_API_KEY` | UK postcode lookup (server) |
| `RESEND_API_KEY` | Admin invite email |
| `EMAIL_FROM` / `RESEND_FROM` | Verified sender address |

Full list: `.env.local.example`.

### Supabase Auth (admin magic-link and password reset)

In **Supabase Dashboard → Authentication → URL Configuration**:

| Setting | Value |
|---------|-------|
| **Site URL** | `https://activora.uk` |
| **Redirect URLs** | `https://activora.uk/**`, `https://www.activora.uk/**` |

Admin magic links use `https://activora.uk/admin/auth/callback`.

Password reset links for all portals (club, parent, franchisor, admin) use:

`https://activora.uk/auth/reset-password/callback?portal=<portal>`

where `<portal>` is `club`, `parent`, `organisation`, or `admin`. Users complete the reset on `https://activora.uk/auth/reset-password` and are redirected to the correct portal login.

**Production fix (admin_users table missing):** run `scripts/apply-admin-users-migration.sql` in Supabase SQL Editor, ensure `SUPABASE_SERVICE_ROLE_KEY` is set on the server, then restart the app.

---

## DNS (Fasthosts — activora.uk)

DNS is managed in **Fasthosts Advanced DNS**. Point records at your **Node server’s public IP** (not Vercel).

### Before you start

1. Log in to [Fasthosts Control Panel](https://www.fasthosts.co.uk/).
2. **Domains** → **activora.uk** → **Advanced DNS**.
3. Set **Automatic DNS Updates** to **OFF** so manual records are not overwritten.

### Production records

| Type | HOST NAME | POINTS TO / Value | Resolves to |
|------|-----------|-------------------|-------------|
| **A** | `@` (blank) | `<your-server-public-IP>` | `activora.uk` |
| **CNAME** | `www` | `activora.uk` | `www.activora.uk` |

Configure your reverse proxy on the server to serve both hostnames over HTTPS. Redirect `www` → apex (or the reverse) and keep `NEXT_PUBLIC_APP_URL` aligned with your canonical choice.

**Do not use `app.activora.uk`** — legacy subdomain; invite links and redirects use `https://activora.uk`.

### SSL

Obtain and renew certificates on your server (e.g. Certbot for nginx). No platform-managed TLS — you manage certificates on the host running Node.

---

## Webhook URLs

Register these in Stripe and GoCardless after the public URL is live.

### Stripe

**Dashboard → Developers → Webhooks → Add endpoint**

| Environment | URL |
|-------------|-----|
| Production | `https://activora.uk/api/stripe/webhook` |

Suggested events: `account.updated`, `checkout.session.completed`.

Copy the signing secret into `STRIPE_WEBHOOK_SECRET`. Connect return URLs are derived from `NEXT_PUBLIC_APP_URL` (see `/api/stripe/connect/onboard`).

### GoCardless

| Environment | URL |
|-------------|-----|
| Production | `https://activora.uk/api/gocardless/webhook` |

---

## Staging vs production

If you run a staging server, use a separate clone or branch, separate env file, and test Stripe/GoCardless keys. Point a staging subdomain (e.g. `beta.activora.uk`) at the staging server IP with a CNAME or A record.

Validate on staging before changing production DNS or switching to live payment keys.

---

## Post-deploy checklist

- [ ] `npm run build` passes on the server
- [ ] Homepage loads at `https://activora.uk`
- [ ] Login flows (`/parent/login`, `/club/login`, `/admin/login`)
- [ ] Supabase sessions load (no amber “Supabase not configured” banner)
- [ ] Map renders (`NEXT_PUBLIC_MAPBOX_TOKEN`)
- [ ] Stripe Connect onboarding redirect works (`/club/finance?tab=stripe`)
- [ ] Stripe webhook test event succeeds
- [ ] Server logs show `[stripe]` warnings if keys are mismatched
- [ ] Server logs show `[stripe-connect]` during Connect onboarding (temporary debug logging)

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Build fails on server | Node 20+; run `npm run build` locally first |
| Amber Supabase banner + 0 sessions | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` set **before** last build; rebuild |
| Map preview unavailable | `NEXT_PUBLIC_MAPBOX_TOKEN`; rebuild after adding |
| Stripe Connect fails silently | Server logs for `[stripe-connect]`; verify `sk_test_` + `pk_test_` from same account |
| Mixed key warning in logs | `[stripe] Key mode mismatch` — align test/live on secret and publishable keys, rebuild |
| Stripe webhook 400 | `STRIPE_WEBHOOK_SECRET` matches endpoint; URL exact |
| 401/redirect loops on portals | `proxy.ts`; auth cookies after login |
| Admin invite / admin_users errors | Run `scripts/apply-admin-users-migration.sql`; set `SUPABASE_SERVICE_ROLE_KEY`; restart |

### Fix empty sessions after deploy

`NEXT_PUBLIC_*` vars are inlined at build time. Adding them without rebuilding leaves the live site broken. Set vars → `npm run build` → restart process.

---

## Platform notes

- **`next.config.ts`** — standard Next.js; no static export.
- **`proxy.ts`** — portal auth gate (Next.js 16 proxy convention).
- **`instrumentation.ts`** — logs Stripe env warnings on server startup.
- **API routes** — `app/api/**` run as Node server handlers when using `next start`.

---

## Related files

- `.env.local.example` — env template
- `package.json` — `build`: `next build`, `start`: `next start`
- `instrumentation.ts` — startup Stripe env warnings
- `lib/stripe/env.ts` — key validation and `logStripeEnvWarnings()`
- `scripts/check-stripe-env.ts` — pre-deploy Stripe check
