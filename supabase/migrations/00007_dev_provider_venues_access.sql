-- =============================================================================
-- DEV ONLY — anon/authenticated access for provider_venues
-- =============================================================================
-- Run after 00006_provider_venues.sql
-- =============================================================================

grant select, insert, update, delete on table public.provider_venues to anon, authenticated;

alter table public.provider_venues enable row level security;

drop policy if exists "DEV ONLY anon read provider_venues" on public.provider_venues;
create policy "DEV ONLY anon read provider_venues"
on public.provider_venues
for select
to anon, authenticated
using (true);

drop policy if exists "DEV ONLY anon insert provider_venues" on public.provider_venues;
create policy "DEV ONLY anon insert provider_venues"
on public.provider_venues
for insert
to anon, authenticated
with check (true);

drop policy if exists "DEV ONLY anon update provider_venues" on public.provider_venues;
create policy "DEV ONLY anon update provider_venues"
on public.provider_venues
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "DEV ONLY anon delete provider_venues" on public.provider_venues;
create policy "DEV ONLY anon delete provider_venues"
on public.provider_venues
for delete
to anon, authenticated
using (true);
