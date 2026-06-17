# Deployment guide ? Playvera Booking (Next.js 16)

This app is designed to run on **Vercel** with Supabase, Stripe Connect, and GoCardless. Use a **staging subdomain first** so your existing live website at the apex domain is not affected.

**Example domain for this project:** `activora.uk` (DNS hosted on **Fasthosts Advanced DNS**). Generic placeholders `mydomain.co.uk` still appear in some tables ? substitute your domain if different.

---

## Recommended host: Vercel (not Netlify)

| Factor | Vercel | Netlify |
|--------|--------|---------|
| Next.js 16 App Router | Native, first-party support | Adapter-based; slower to adopt new Next features |
| API routes (`/api/stripe/webhook`, etc.) | Serverless functions out of the box | Requires `@netlify/plugin-nextjs`; webhook/raw-body quirks |
| `proxy.ts` (auth gate for portals) | Supported (Next.js 16 proxy convention) | Supported via plugin, but less tested on day-one releases |
| Stripe / GoCardless webhooks | Raw body via Route Handlers works reliably | Possible, but more configuration |
| Deploy UX for this stack | Zero config for standard Next.js | Extra plugin + redirects config often needed |

**Verdict:** Use **Vercel**. No `vercel.json` is required ? Next.js 16 is auto-detected (`next build`, Node serverless functions, Edge proxy).

---

## Build verification (run locally before every deploy)

```bash
npm ci          # or npm install
npm run typecheck
npm run lint
npm run build
npm run start   # optional smoke test on http://localhost:3000
```

**Expected:** `next build` completes with `? Compiled successfully` and lists App + API routes. The build also reports `? Proxy (Middleware)` from root `proxy.ts` (portal auth redirects).

**Stripe env sanity check (optional):**

```bash
npm run check:stripe-env
```

---

## Deploy with Vercel CLI (local)

Use this when you deploy from your machine instead of (or before) connecting Git in the Vercel dashboard.

**Prerequisites:** Node.js 20+ (Vercel may use 24.x on the build image), local `npm run build` passes.

`ash
# 1. Authenticate (browser device flow)
npx vercel login

# 2. From the repo root ? link or create the project (writes .vercel/project.json)
npx vercel link

# 3. Set env vars in the dashboard (Project ? Settings ? Environment Variables)
#    Copy from .env.local.example ? especially NEXT_PUBLIC_APP_URL=https://app.activora.uk for staging.

# 4. Production deploy
npx vercel --prod
`

**Non-interactive link/deploy** (CI or scripted): set `VERCEL_TOKEN` from [Account ? Tokens](https://vercel.com/account/tokens), then:

`ash
npx vercel link --yes
npx vercel --prod --yes
`

**After deploy:** note the production alias (e.g. `https://playvera-booking.vercel.app`). Add custom domain `app.activora.uk` under **Project ? Settings ? Domains**, then redeploy if you changed env vars.

**Optional:** connect the Git repo in the dashboard for automatic deploys on push to `main`.
---

## Continuous deployment (GitHub ? Vercel)

After the Git repository is connected, every push to **`main`** triggers a **Production** deployment automatically. Pull requests and other branches get **Preview** deployments when Preview environment variables are configured.

### One-time setup

1. Push this repo to GitHub (see below if not done yet).
2. In [Vercel](https://vercel.com/chimaakude-cmds-projects/playvera-booking/settings/git): **Project ? Settings ? Git ? Connect Git Repository**.
3. Choose the GitHub repo (e.g. `playvera-booking`) and confirm **Production Branch** = **`main`**.
4. Ensure **Production** environment variables are set (see [Environment variables](#2-environment-variables)); redeploy once after adding `NEXT_PUBLIC_*` keys.
5. Optional: duplicate the same variables for **Preview** so PR preview URLs work (requires Git connected first).

### Day-to-day workflow

```bash
git checkout main
git pull
# make changes, commit
git push origin main
```

Vercel builds with **`npm install`** and **`npm run build`** (`next build`) and promotes the result to Production. No manual `vercel --prod` is required unless you are deploying from CLI only.

### DNS reminder (staging)

- **`app.activora.uk`** ? CNAME **`cname.vercel-dns.com`** (Fasthosts Advanced DNS; keep Automatic DNS Updates **OFF**).
- Add **`app.activora.uk`** under **Project ? Settings ? Domains** if it is not listed yet.
- Apex **`activora.uk`** cutover steps remain in [Fasthosts + Vercel ? production cutover checklist](#fasthosts--vercel--production-cutover-checklist).


---

## Staging-first strategy (critical)

> **Do not point your apex domain (`mydomain.co.uk`) or change existing `@` / `www` DNS until staging is fully validated.**

Your current marketing site can stay live on the apex. Deploy the booking app to a **subdomain only**:

| Phase | Hostname | Purpose |
|-------|----------|---------|
| **1 ? Staging** | `app.mydomain.co.uk` | Test deploy, env vars, Stripe/GoCardless webhooks, auth flows |
| **2 ? Production cutover** (later) | `mydomain.co.uk` + `www` | Only after sign-off on staging |

**Recommended staging subdomain:** `app.mydomain.co.uk` ? clearly separates the booking product from a marketing site and avoids collision with `www`.

Alternative: `beta.mydomain.co.uk` if you prefer a ?preview? label.

---

## Vercel project setup (click-by-click)

### 1. Connect the repository

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. Go to [vercel.com/new](https://vercel.com/new).
3. **Import** the `playvera-booking` repository.
4. **Framework Preset:** Next.js (auto-detected).
5. **Root Directory:** `.` (repo root).
6. **Build Command:** `next build` (default).
7. **Output Directory:** leave empty (default ? do **not** set `out`; this is not a static export).
8. **Install Command:** `npm install` (default).
9. **Do not deploy yet** ? add environment variables first (next section).

### 2. Environment variables

In Vercel: **Project ? Settings ? Environment Variables**.

Add each variable for **Production** (and **Preview** if you want PR previews to work with real services ? usually use test keys for Preview).

See [Production environment variables](#production-environment-variables) below.

Set `NEXT_PUBLIC_APP_URL` to your **staging URL first**:

```
https://app.activora.uk
```

Update to `https://activora.uk` only when you cut over the apex domain.

### 3. Deploy

1. Click **Deploy** (or push to `main` if auto-deploy is enabled).
2. Wait for the build to finish (should match local `npm run build`).
3. Note the default `*.vercel.app` URL for initial smoke tests.

### 4. Add staging custom domain

1. **Project ? Settings ? Domains ? Add**
2. Enter: `app.activora.uk` (or `app.mydomain.co.uk` for other domains)
3. Vercel shows the DNS record(s) to add (see [DNS records](#dns-records) and [Fasthosts Advanced DNS](#fasthosts-advanced-dns--activorauk)).
4. Add the record at your domain registrar/DNS host.
5. Wait for **Valid Configuration** and **SSL Certificate: Active** (usually 5?30 minutes).

### 5. Validate staging

- [ ] Homepage loads on `https://app.mydomain.co.uk`
- [ ] Login flows (`/parent/login`, `/club/login`, etc.)
- [ ] Supabase reads/writes (sessions, bookings)
- [ ] Mapbox maps render (`NEXT_PUBLIC_MAPBOX_TOKEN`)
- [ ] Stripe Connect onboarding redirect returns to `/club/finance?tab=stripe&connected=1`
- [ ] Stripe webhook receives test events (Dashboard ? Webhooks ? Send test event)
- [ ] GoCardless webhook endpoint responds (if configured)
- [ ] Address lookup works (if `GETADDRESS_API_KEY` set)

### 6. Production cutover (only after staging sign-off)

1. Add `mydomain.co.uk` and `www.mydomain.co.uk` in Vercel Domains.
2. Update apex/`www` DNS (see table below).
3. Set primary domain and redirect (see [www vs apex](#www-vs-apex-domain-setup)).
4. Update `NEXT_PUBLIC_APP_URL` to `https://mydomain.co.uk`.
5. Redeploy.
6. Update Stripe and GoCardless webhook URLs to production endpoints.
7. Switch API keys from test/sandbox to live where appropriate.

---

## Production environment variables

Copy from `.env.local.example`. Set in **Vercel ? Settings ? Environment Variables**.

### Required for core app

| Variable | Example / notes | Exposed to browser |
|----------|-----------------|-------------------|
| `NEXT_PUBLIC_APP_URL` | `https://app.mydomain.co.uk` (staging) ? `https://mydomain.co.uk` (prod) | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only; required for Admin Users API in production) | No |
| `NEXT_PUBLIC_DATA_PROVIDER` | `supabase` | Yes |
| `NEXT_PUBLIC_IMAGE_STORAGE_PROVIDER` | `supabase` (recommended for production) | Yes |

### Stripe Connect (bookings + platform)

| Variable | Example / notes | Exposed to browser |
|----------|-----------------|-------------------|
| `STRIPE_SECRET_KEY` | `sk_live_...` (production) | No |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Yes |
| `STRIPE_PUBLISHABLE_KEY` | Optional server fallback if public key not inlined at build | No |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from Stripe webhook endpoint | No |

Keys must match mode (all live or all test). Run `npm run check:stripe-env` locally with production values before cutover.

### GoCardless (provider subscriptions)

| Variable | Example / notes | Exposed to browser |
|----------|-----------------|-------------------|
| `GOCARDLESS_ACCESS_TOKEN` | Live access token | No |
| `GOCARDLESS_ENVIRONMENT` | `live` (or `sandbox` for staging) | No |
| `GOCARDLESS_WEBHOOK_SECRET` | From GoCardless dashboard | No |

`GOCARDLESS_ENV` is a legacy alias for `GOCARDLESS_ENVIRONMENT`.

### Maps & geocoding

| Variable | Example / notes | Exposed to browser |
|----------|-----------------|-------------------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox public token | Yes |

### Address lookup (UK postcodes ? club session wizard)

| Variable | Example / notes | Exposed to browser |
|----------|-----------------|-------------------|
| `GETADDRESS_API_KEY` | Preferred in production (server-only) | No |
| `NEXT_PUBLIC_GETADDRESS_API_KEY` | Alternative; exposes key to client bundle | Yes |

The `/api/addresses/[postcode]` route prefers `GETADDRESS_API_KEY` on the server.

### Temporary test admin login (staging/dev only)

Server-side credentials for `/admin-login` during development. **Remove before production launch.**

| Variable | Example / notes | Exposed to browser |
|----------|-----------------|-------------------|
| `ADMIN_TEST_EMAIL` | Default: `admin-test@activora.local` (see `.env.local.example`) | No |
| `ADMIN_TEST_PASSWORD` | Auto-generated; server-validated at login | No |

Credentials are never bundled in the client.

#### Initial setup (local)

```bash
npm run admin:regenerate-credentials
```

The script writes `ADMIN_TEST_EMAIL` and `ADMIN_TEST_PASSWORD` to `.env.local` and prints the password **once** to the terminal. Restart the dev server if it is already running, then sign in at `/admin-login`.

#### Regenerate while developing

- **Terminal:** `npm run admin:regenerate-credentials` (updates `.env.local`, prints password once).
- **Admin UI:** Admin ? Settings ? **Regenerate Test Admin Credentials** (requires an active test admin session). Updates `.env.local` when writable; otherwise updates in-memory credentials for the current server process only.

On **Vercel**, the UI/API cannot write project env files. Regeneration updates in-memory credentials until the next cold start; set `ADMIN_TEST_PASSWORD` manually in Vercel ? Project ? Environment Variables for persistence across deploys.

Remove or replace with production auth before go-live.

### Admin user invites (email)

| Variable | Example / notes | Exposed to browser |
|----------|-----------------|-------------------|
| `RESEND_API_KEY` | Resend API key for transactional email | No |
| `EMAIL_FROM` or `RESEND_FROM` | Verified sender, e.g. `Activora <noreply@activora.co.uk>` | No |
| `ADMIN_INVITE_EMAIL_PROVIDER` | Optional legacy flag; Resend vars above are preferred | No |

When email is configured, admin invites are sent automatically. Otherwise the invite form shows a copy-link UI after Send.

**Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.** It is used only in server route handlers (`lib/admin-users/server-store.ts`) to read/write `admin_users` and bypass RLS. Run migrations `00035`–`00038` on your Supabase project.

### Optional

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_DEFAULT_PROVIDER_ID` | Pin default Supabase provider UUID (skip slug lookup) |

### Not used by this codebase

These are **not** referenced in application code and do not need to be set unless you add features later:

- `SUPABASE_SECRET_KEY` (alias only — use `SUPABASE_SERVICE_ROLE_KEY`)
- `VERCEL_*` (auto-injected by Vercel at runtime)

---

## DNS records

Add these at your DNS provider. TTL: 300?3600 seconds (Fasthosts default is fine).

### Staging ? `app.activora.uk` (do this first)

| Type | Name / Host | Value | Notes |
|------|-------------|-------|-------|
| **CNAME** | `app` | `cname.vercel-dns.com` | Resolves to `app.activora.uk` ? Vercel |

Alternative staging hostname: `beta.activora.uk` ? use Host `beta` instead of `app`.

After propagation, Vercel issues HTTPS automatically.

### Production ? apex `activora.uk` (only after staging validated)

| Type | Name / Host | Value | Notes |
|------|-------------|-------|-------|
| **A** | `@` (or blank) | `76.76.21.21` | Vercel anycast IP for apex |
| **A** | `@` (or blank) | `76.76.19.19` | Secondary Vercel IP (add both if Fasthosts allows multiple A records) |

If Fasthosts **Advanced DNS** offers an **ALIAS** record at the apex, you may use that instead of A records:

| Type | Name / Host | Value |
|------|-------------|-------|
| **ALIAS** | `@` (or blank) | `cname.vercel-dns.com` |

Follow whatever Vercel shows in **Project ? Settings ? Domains** for your domain ? it may recommend one IP or both.

### Production ? `www.activora.uk`

| Type | Name / Host | Value |
|------|-------------|-------|
| **CNAME** | `www` | `cname.vercel-dns.com` |

### What not to change during staging

- Leave existing **apex (`@`)** and **`www`** records untouched if they serve your current live website.
- Only add the **`app`** (or **`beta`**) CNAME until you are ready for cutover.

---

## Fasthosts Advanced DNS ? `activora.uk`

Use this section if your domain is on **Fasthosts** with **Advanced DNS** (empty A/CNAME/ALIAS/MX/TXT tables, **Automatic DNS Updates** visible).

### Staging recommendation

Deploy Playvera Booking to a **subdomain first** so the live site at `activora.uk` is not affected:

| Choice | URL | Fasthosts Host Name |
|--------|-----|---------------------|
| **Recommended** | `https://app.activora.uk` | `app` |
| Alternative | `https://beta.activora.uk` | `beta` |

Do **not** change apex (`@`) or `www` DNS until staging is fully tested and you are ready for production cutover.

### Exact DNS records (Fasthosts field names)

Fasthosts labels the two CNAME fields **HOST NAME** and **POINTS TO**. Do not include `activora.uk` in HOST NAME ? only the subdomain label.

#### Phase 1 ? Staging only (safe; apex unchanged)

| Record type | HOST NAME | POINTS TO / Value | Resolves to |
|-------------|-----------|-------------------|-------------|
| **CNAME** | `app` | `cname.vercel-dns.com` | `app.activora.uk` |

*(If using `beta` instead: HOST NAME = `beta`, POINTS TO = `cname.vercel-dns.com`.)*

#### Phase 2 ? Production cutover (after staging sign-off)

| Record type | HOST NAME | POINTS TO / Value | Resolves to |
|-------------|-----------|-------------------|-------------|
| **A** | *(leave blank or `@`)* | `76.76.21.21` | `activora.uk` |
| **A** | *(leave blank or `@`)* | `76.76.19.19` | `activora.uk` *(optional second A if Fasthosts allows)* |
| **CNAME** | `www` | `cname.vercel-dns.com` | `www.activora.uk` |

**OR** at apex, if **ADD ALIAS RECORD** is available:

| Record type | HOST NAME | POINTS TO | Resolves to |
|-------------|-----------|-----------|-------------|
| **ALIAS** | *(blank / `@`)* | `cname.vercel-dns.com` | `activora.uk` |
| **CNAME** | `www` | `cname.vercel-dns.com` | `www.activora.uk` |

Do not create both ALIAS and A records for the same apex ? use one method only.

### Automatic DNS Updates ? turn OFF before manual records

If **Automatic DNS Updates** is **ON**, Fasthosts (or a linked hosting product) may overwrite manual DNS when you change hosting settings.

**Before adding Vercel records:**

1. In Fasthosts domain management for `activora.uk`, open **Advanced DNS**.
2. Find **Automatic DNS Updates** and set it to **OFF**.
3. Save if prompted.
4. Add your CNAME/A/ALIAS records manually (steps below).

Re-enable automatic updates only if you understand it will replace custom records ? generally keep it **OFF** while Vercel hosts the site.

### Fasthosts click checklist (staging)

1. Log in to [Fasthosts Control Panel](https://www.fasthosts.co.uk/).
2. **Domains** ? select **activora.uk**.
3. Open **Advanced DNS** (or **Manage DNS** ? Advanced DNS).
4. Confirm **Automatic DNS Updates** is **OFF**.
5. Click **ADD CNAME RECORD**.
6. **HOST NAME:** `app` *(not `app.activora.uk`)*.
7. **POINTS TO:** `cname.vercel-dns.com` *(no `https://`, no trailing dot required)*.
8. Save / confirm the record.
9. Leave **A**, **ALIAS**, and **www** CNAME empty or unchanged if they currently serve your live marketing site.

### Vercel click checklist (staging)

1. **Project ? Settings ? Environment Variables** ? set `NEXT_PUBLIC_APP_URL` to `https://app.activora.uk`.
2. Deploy (or redeploy after env change).
3. **Project ? Settings ? Domains ? Add** ? enter `app.activora.uk`.
4. Vercel shows **Invalid Configuration** until DNS propagates ? expected for a few minutes up to ~48 hours (usually under 30 minutes).
5. Click the domain row ? confirm Vercel expects a **CNAME** for `app` ? `cname.vercel-dns.com` (matches Fasthosts record above).
6. Wait until status shows **Valid Configuration** and **SSL Certificate: Active**.
7. Open `https://app.activora.uk` and run the [staging validation checklist](#5-validate-staging).

### Fasthosts + Vercel ? production cutover checklist

Only after staging QA passes:

**Fasthosts**

1. **Advanced DNS** ? **Automatic DNS Updates** still **OFF**.
2. Remove or update old apex/`www` records that pointed to previous hosting (only when ready to move traffic).
3. **ADD A RECORD** (or **ADD ALIAS RECORD**): apex ? `76.76.21.21` (and second A `76.76.19.19` if supported), **or** ALIAS ? `cname.vercel-dns.com`.
4. **ADD CNAME RECORD**: HOST `www` ? `cname.vercel-dns.com`.

**Vercel**

1. **Domains ? Add** `activora.uk` and `www.activora.uk`.
2. Set **activora.uk** as **Primary** domain.
3. Configure redirect: **www.activora.uk** ? **activora.uk** (recommended canonical URL).
4. Update `NEXT_PUBLIC_APP_URL` to `https://activora.uk` and redeploy.
5. Update Stripe / GoCardless webhook URLs to production endpoints.

### SSL on Vercel

No certificate upload is required. Once DNS validates, Vercel provisions and renews TLS automatically. Status: **Project ? Settings ? Domains** ? **Valid Configuration** + active certificate.

### www redirect (production)

In **Vercel ? Domains**, after both apex and www are added:

- Set **activora.uk** as primary.
- Enable **Redirect www.activora.uk to activora.uk** (or the reverse if you prefer `www` as canonical ? but keep `NEXT_PUBLIC_APP_URL` aligned with your choice).

Staging subdomain (`app.activora.uk`) does not need a www redirect.

---

## www vs apex domain setup

**Recommendation:** Use **non-www apex** as the canonical URL: `https://mydomain.co.uk`

1. In Vercel **Domains**, set `mydomain.co.uk` as the **Primary** domain.
2. Add `www.mydomain.co.uk` as a secondary domain.
3. Vercel prompts to redirect `www` ? apex (or apex ? `www`). Choose **redirect www to apex**.

This keeps Stripe/GoCardless redirect URLs and `NEXT_PUBLIC_APP_URL` consistent.

For staging, only `app.mydomain.co.uk` is needed ? no www redirect required.

---

## HTTPS / SSL

Vercel (and Netlify) **automatically provision and renew** TLS certificates once DNS validates. No manual certificate upload. Ensure:

- DNS points correctly (no conflicting old A/CNAME records).
- CAA records (if any) allow Let's Encrypt / Vercel issuance.

Status appears in **Project ? Settings ? Domains** as ?Valid Configuration? and an active certificate.

---

## Webhook URL updates

After the public URL is known, register these endpoints in each provider dashboard.

### Stripe

**Dashboard ? Developers ? Webhooks ? Add endpoint**

| Environment | URL |
|-------------|-----|
| Staging | `https://app.mydomain.co.uk/api/stripe/webhook` |
| Production | `https://mydomain.co.uk/api/stripe/webhook` |

Suggested events (minimum for current handlers):

- `account.updated`
- `checkout.session.completed`

Copy the signing secret into `STRIPE_WEBHOOK_SECRET` for the matching Vercel environment.

Stripe Connect return URLs are derived from `NEXT_PUBLIC_APP_URL` (see `/api/stripe/connect/onboard`).

### GoCardless

**Dashboard ? Developers ? Webhooks ? Create webhook**

| Environment | URL |
|-------------|-----|
| Staging | `https://app.mydomain.co.uk/api/gocardless/webhook` |
| Production | `https://mydomain.co.uk/api/gocardless/webhook` |

Copy the webhook secret into `GOCARDLESS_WEBHOOK_SECRET`. Set `GOCARDLESS_ENVIRONMENT=live` for production.

---

## Platform compatibility notes

### `next.config.ts`

Standard Next.js config ? no `output: 'export'`. Image remote patterns include Supabase storage. No changes needed for Vercel.

### `proxy.ts` (portal authentication)

Root-level `proxy.ts` replaces the deprecated `middleware.ts` in Next.js 16. It guards `/parent`, `/club`, `/admin`, and `/organisation` routes via cookie-based role checks. Vercel deploys this as Edge middleware automatically; the build output shows `? Proxy (Middleware)`.

### API routes

All routes under `app/api/**` deploy as serverless functions. Webhook handlers read raw bodies with `request.text()` ? compatible with Vercel without extra config.

---

## Personal checklist (hosting + domain)

### Phase A ? Staging (safe; does not affect live apex site)

- [ ] Run `npm run build` locally ? passes
- [ ] Create Vercel project from Git repo
- [ ] Add all env vars (use **test/sandbox** keys where possible)
- [ ] Set `NEXT_PUBLIC_APP_URL=https://app.activora.uk`
- [ ] Deploy to Vercel; confirm `*.vercel.app` URL works
- [ ] Vercel ? Domains ? add `app.activora.uk`
- [ ] Fasthosts ? Advanced DNS ? **Automatic DNS Updates OFF**
- [ ] Fasthosts ? **ADD CNAME RECORD**: HOST `app` ? POINTS TO `cname.vercel-dns.com`
- [ ] Wait for DNS + SSL active in Vercel
- [ ] Smoke-test app on `https://app.activora.uk`
- [ ] Stripe: add staging webhook ? `.../api/stripe/webhook`, update `STRIPE_WEBHOOK_SECRET`, redeploy if needed
- [ ] GoCardless: add staging webhook ? `.../api/gocardless/webhook` (if using GoCardless)
- [ ] Full QA on staging

### Phase B ? Production cutover (only after Phase A sign-off)

- [ ] Switch env vars to **live** Stripe / GoCardless / production Supabase as needed
- [ ] Set `NEXT_PUBLIC_APP_URL=https://activora.uk`
- [ ] Vercel ? Domains ? add `activora.uk` and `www.activora.uk`
- [ ] Fasthosts ? apex A `76.76.21.21` (+ `76.76.19.19` if supported) **or** ALIAS ? `cname.vercel-dns.com`
- [ ] Fasthosts ? CNAME `www` ? `cname.vercel-dns.com`
- [ ] Vercel: set primary domain to `activora.uk`; redirect www ? apex
- [ ] Redeploy
- [ ] Stripe / GoCardless: add **production** webhook URLs; update secrets
- [ ] Final production smoke test
- [ ] Monitor Stripe webhook delivery and error logs in Vercel

---

## Post-deploy: fix empty sessions (amber banner)

If `https://app.activora.uk` (or your staging URL) shows:

- An **amber banner**: *"Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY?"*
- **0 activities** on `/sessions`
- **Map preview unavailable**

the deploy is missing required `NEXT_PUBLIC_*` variables. They are inlined at **build time** ? adding them in Vercel without redeploying will not fix the live site.

### Root cause

1. `NEXT_PUBLIC_DATA_PROVIDER` defaults to **`supabase`** (see `.env.local.example`).
2. `loadSessionsWithMeta()` in `lib/data/providers/resilient-sessions.ts` returns an empty list plus the setup error when Supabase env vars are absent.
3. `SessionsPageContent` renders that error in the amber banner (`app/sessions/SessionsPageContent.tsx`).
4. The map needs `NEXT_PUBLIC_MAPBOX_TOKEN` (public `pk.` token). Without it, `SessionsMap` shows "Map preview unavailable".

### Fix (Vercel dashboard)

**Project ? Settings ? Environment Variables ? Production** (and Preview if you use PR previews). Add:

| Variable | Required for |
|----------|----------------|
| `NEXT_PUBLIC_APP_URL` | Correct redirects and Stripe/GoCardless return URLs (`https://app.activora.uk` for staging) |
| `NEXT_PUBLIC_SUPABASE_URL` | Session listing, auth, storage |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Session listing, auth, storage |
| `NEXT_PUBLIC_DATA_PROVIDER` | Set to `supabase` (default if omitted) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Parent session search map and geocoding |

Values come from your Supabase project (**Settings ? API**) and Mapbox account (**Access tokens**). See `.env.local.example` for the full list (Stripe, GoCardless, getAddress, etc.).

### Supabase project setup

After env vars are set, run migrations in the Supabase SQL Editor (minimum for public sessions):

1. `supabase/migrations/00001_activora_schema.sql`
2. `supabase/migrations/00002_storage_buckets.sql`
3. `supabase/migrations/00004_session_location.sql`
4. `supabase/migrations/00005_dev_anon_access.sql` (anon read access for staging/dev)
5. `supabase/migrations/00035_admin_users.sql` — platform admin users + audit log
6. `supabase/migrations/00036_admin_invites.sql` — admin invite tokens (required for **Admin → Invite admin user** on Vercel; replaces filesystem `.data/admin-users.json`)

Seed or create sessions via the club portal once Supabase is connected.

### Redeploy

1. Save env vars in Vercel.
2. **Deployments ? ? ? Redeploy** (or push a commit to trigger a new build).

`NEXT_PUBLIC_*` changes always require a new build.

### Can production use localStorage instead?

Only for **local dev demos** on a single browser. Set `NEXT_PUBLIC_DATA_PROVIDER=localStorage` ? sessions live in that browser's `localStorage` only; other visitors still see zero activities. **Production should use Supabase.**

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Build fails on Vercel | Compare Node version (Vercel uses 20.x by default); run `npm run build` locally |
| Admin dashboard shows "Supabase not configured" but Stripe works | `paymentsStatus` treated no-data as env-missing; fix deployed — also verify `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` were set **before** last Vercel build (redeploy if added after) |
| Amber Supabase banner + 0 sessions | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; redeploy after adding |
| Map preview unavailable | `NEXT_PUBLIC_MAPBOX_TOKEN` (`pk.` prefix); redeploy after adding |
| 401/redirect loops on portals | `proxy.ts` matcher paths; auth cookies set after login |
| Stripe webhook 400 | `STRIPE_WEBHOOK_SECRET` matches the endpoint; URL is exact |
| Maps blank (token set) | Token valid and not restricted; sessions have venue coordinates in Supabase |
| Supabase errors | `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY`; RLS policies / migrations in Supabase |
| Admin invite ENOENT `.data` | Run migrations `00035_admin_users.sql` and `00036_admin_invites.sql`; redeploy after env vars set |
| Address lookup fails | `GETADDRESS_API_KEY` on server; domain allowlist in getAddress.io dashboard |

---

## Related files

- `.env.local.example` ? local and production env template
- `package.json` ? `build`: `next build`
- `next.config.ts` ? image domains, no static export
- `proxy.ts` ? portal route protection
