# Activora Supabase schema

The app **still uses localStorage**. This schema is ready in Supabase but not wired to the UI yet.

## Where to paste the SQL in Supabase

1. Go to **[Supabase Dashboard](https://supabase.com/dashboard)** and open your **Activora** project (`zvgrjqyewrityijhxpae`).
2. In the left sidebar, click **SQL Editor**.
3. Click **+ New query**.
4. Open `supabase/migrations/00001_activora_schema.sql` in this repo, **select all**, and **paste** into the editor.
5. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).
6. Confirm success in the **Results** panel (`Success. No rows returned`).

To verify: **Table Editor** in the left sidebar should list all nine tables.

## Storage buckets

Session wizard images upload to Supabase Storage when configured. See **[STORAGE_SETUP.md](./STORAGE_SETUP.md)**.

## Auth email branding

Branded Magic Link templates and custom SMTP (Resend → `no-reply@activora.uk`):

- **[templates/README.md](./templates/README.md)** — paste HTML into Dashboard
- **[AUTH_EMAIL_BRANDING.md](./AUTH_EMAIL_BRANDING.md)** — brand colors and assets
- **[SMTP_SETUP.md](./SMTP_SETUP.md)** — DNS, Resend, Supabase SMTP settings

## Session data (Supabase + localStorage fallback)

After applying `00001_activora_schema.sql`, also run:

1. `migrations/00002_storage_buckets.sql` — image buckets
2. `migrations/00004_session_location.sql` — venue columns on sessions
3. **`migrations/00005_dev_anon_access.sql`** — **DEV ONLY** anon GRANTs + RLS (fixes "permission denied for table providers")

`00003_sessions_rls.sql` is superseded by `00005` for development; you only need to run `00005`.

Set in `.env.local`:

```env
NEXT_PUBLIC_DATA_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Session creation saves to `sessions`, `session_dates`, and `tickets`. Run `migrations/00004_session_location.sql` to add venue columns. If Supabase fails, the app falls back to localStorage and shows a warning.

## Tables

| Table | Relationships |
|-------|----------------|
| **providers** | → has many **sessions** |
| **parent_profiles** | → has many **children**, **bookings**, **refund_requests** |
| **children** | → belongs to **parent_profiles**; linked to **bookings** via **booking_children** |
| **sessions** | → belongs to **providers**; has many **session_dates**, **tickets**, **bookings** |
| **session_dates** | → belongs to **sessions**; optional on **bookings** |
| **tickets** | → belongs to **sessions**; optional on **bookings** |
| **bookings** | → belongs to **session**, optional **session_date**, **ticket**, **parent_profile** |
| **booking_children** | → belongs to **booking** + optional **child** |
| **refund_requests** | → belongs to **booking** + optional **parent_profile** |

## Enums

| Enum | Values |
|------|--------|
| `session_booking_type` | `individual`, `block`, `subscription` |
| `ticket_type` | `free`, `per_session`, `block_price`, `free_trial`, `subscription_placeholder` |
| `booking_status` | `pending`, `confirmed`, `cancelled`, `refund_requested` |
| `refund_request_status` | `pending`, `approved`, `rejected`, `cancelled` |

## Regenerate TypeScript types (after applying SQL)

```bash
npx supabase gen types typescript --project-id zvgrjqyewrityijhxpae > lib/database.types.ts
```

## localStorage (unchanged)

| localStorage key | Future Supabase tables |
|------------------|------------------------|
| `playvera-club-sessions` | `providers`, `sessions`, `session_dates`, `tickets` |
| `playvera-bookings` | `bookings`, `booking_children` |
| `activora-children` | `children` |
| `activora-parent-profile` | `parent_profiles` |
| `activora-fee-settings` | `providers.fee_handling`, `providers.platform_fee_percent` |
