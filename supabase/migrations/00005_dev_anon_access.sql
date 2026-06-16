-- =============================================================================
-- DEV ONLY — anon/authenticated table access for Activora (no auth yet)
-- =============================================================================
-- ⚠️  DEVELOPMENT ONLY. DO NOT USE IN PRODUCTION.
--
-- Fixes: "permission denied for table providers" (and sessions/session_dates/tickets)
-- when using the Supabase anon key from the browser.
--
-- This migration:
--   1. GRANTs schema + table privileges to anon/authenticated
--   2. Creates permissive RLS policies (required even with GRANTs)
--   3. Seeds a default "Demo Provider" row if none exists
--
-- Replace these policies with provider-scoped auth rules before going live.
-- Does NOT use the service role key.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Schema + table GRANTs (fixes "permission denied for table …")
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table public.providers to anon, authenticated;
grant select, insert, update, delete on table public.sessions to anon, authenticated;
grant select, insert, update, delete on table public.session_dates to anon, authenticated;
grant select, insert, update, delete on table public.tickets to anon, authenticated;

-- Future tables in this schema (dev convenience only)
alter default privileges in schema public
grant select, insert, update, delete on tables to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. DEV ONLY RLS policies — providers
-- ---------------------------------------------------------------------------

drop policy if exists "DEV ONLY anon read providers" on public.providers;
create policy "DEV ONLY anon read providers"
on public.providers
for select
to anon, authenticated
using (true);

drop policy if exists "DEV ONLY anon insert providers" on public.providers;
create policy "DEV ONLY anon insert providers"
on public.providers
for insert
to anon, authenticated
with check (true);

drop policy if exists "DEV ONLY anon update providers" on public.providers;
create policy "DEV ONLY anon update providers"
on public.providers
for update
to anon, authenticated
using (true)
with check (true);

-- Drop legacy policy names from 00003 if present (avoid duplicates)
drop policy if exists "Anon read providers" on public.providers;
drop policy if exists "Anon insert providers" on public.providers;

-- ---------------------------------------------------------------------------
-- 3. DEV ONLY RLS policies — sessions
-- ---------------------------------------------------------------------------

drop policy if exists "DEV ONLY anon read sessions" on public.sessions;
create policy "DEV ONLY anon read sessions"
on public.sessions
for select
to anon, authenticated
using (true);

drop policy if exists "DEV ONLY anon insert sessions" on public.sessions;
create policy "DEV ONLY anon insert sessions"
on public.sessions
for insert
to anon, authenticated
with check (true);

drop policy if exists "DEV ONLY anon update sessions" on public.sessions;
create policy "DEV ONLY anon update sessions"
on public.sessions
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "DEV ONLY anon delete sessions" on public.sessions;
create policy "DEV ONLY anon delete sessions"
on public.sessions
for delete
to anon, authenticated
using (true);

drop policy if exists "Anon read sessions" on public.sessions;
drop policy if exists "Anon insert sessions" on public.sessions;
drop policy if exists "Anon update sessions" on public.sessions;
drop policy if exists "Anon delete sessions" on public.sessions;

-- ---------------------------------------------------------------------------
-- 4. DEV ONLY RLS policies — session_dates
-- ---------------------------------------------------------------------------

drop policy if exists "DEV ONLY anon read session_dates" on public.session_dates;
create policy "DEV ONLY anon read session_dates"
on public.session_dates
for select
to anon, authenticated
using (true);

drop policy if exists "DEV ONLY anon insert session_dates" on public.session_dates;
create policy "DEV ONLY anon insert session_dates"
on public.session_dates
for insert
to anon, authenticated
with check (true);

drop policy if exists "DEV ONLY anon update session_dates" on public.session_dates;
create policy "DEV ONLY anon update session_dates"
on public.session_dates
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "DEV ONLY anon delete session_dates" on public.session_dates;
create policy "DEV ONLY anon delete session_dates"
on public.session_dates
for delete
to anon, authenticated
using (true);

drop policy if exists "Anon read session_dates" on public.session_dates;
drop policy if exists "Anon insert session_dates" on public.session_dates;
drop policy if exists "Anon update session_dates" on public.session_dates;
drop policy if exists "Anon delete session_dates" on public.session_dates;

-- ---------------------------------------------------------------------------
-- 5. DEV ONLY RLS policies — tickets
-- ---------------------------------------------------------------------------

drop policy if exists "DEV ONLY anon read tickets" on public.tickets;
create policy "DEV ONLY anon read tickets"
on public.tickets
for select
to anon, authenticated
using (true);

drop policy if exists "DEV ONLY anon insert tickets" on public.tickets;
create policy "DEV ONLY anon insert tickets"
on public.tickets
for insert
to anon, authenticated
with check (true);

drop policy if exists "DEV ONLY anon update tickets" on public.tickets;
create policy "DEV ONLY anon update tickets"
on public.tickets
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "DEV ONLY anon delete tickets" on public.tickets;
create policy "DEV ONLY anon delete tickets"
on public.tickets
for delete
to anon, authenticated
using (true);

drop policy if exists "Anon read tickets" on public.tickets;
drop policy if exists "Anon insert tickets" on public.tickets;
drop policy if exists "Anon update tickets" on public.tickets;
drop policy if exists "Anon delete tickets" on public.tickets;

-- ---------------------------------------------------------------------------
-- 6. Seed default development provider
-- ---------------------------------------------------------------------------

insert into public.providers (name, slug, location)
select 'Demo Provider', 'demo-provider', 'London'
where not exists (
  select 1
  from public.providers
  where slug = 'demo-provider'
);

comment on table public.providers is
  'Activity clubs / providers on Activora. DEV: anon access via 00005_dev_anon_access.sql only.';
