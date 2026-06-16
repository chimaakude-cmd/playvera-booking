-- Admin provider account controls (status + dev access for related tables)

alter table public.providers
  add column if not exists account_status text not null default 'active';

alter table public.providers
  drop constraint if exists providers_account_status_check;

alter table public.providers
  add constraint providers_account_status_check
  check (account_status in ('active', 'paused', 'suspended'));

comment on column public.providers.account_status is
  'Platform admin account state: active | paused | suspended';

-- Dev anon access for admin provider reads/writes (matches 00005 pattern)
grant select, insert, update, delete on table public.club_profiles to anon, authenticated;
grant select, insert, update, delete on table public.provider_subscriptions to anon, authenticated;
grant select, insert, update, delete on table public.club_team_members to anon, authenticated;
grant select on table public.bookings to anon, authenticated;

drop policy if exists "DEV ONLY anon read club_profiles" on public.club_profiles;
create policy "DEV ONLY anon read club_profiles"
on public.club_profiles
for select
to anon, authenticated
using (true);

drop policy if exists "DEV ONLY anon update club_profiles" on public.club_profiles;
create policy "DEV ONLY anon update club_profiles"
on public.club_profiles
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "DEV ONLY anon read provider_subscriptions" on public.provider_subscriptions;
create policy "DEV ONLY anon read provider_subscriptions"
on public.provider_subscriptions
for select
to anon, authenticated
using (true);

drop policy if exists "DEV ONLY anon insert provider_subscriptions" on public.provider_subscriptions;
create policy "DEV ONLY anon insert provider_subscriptions"
on public.provider_subscriptions
for insert
to anon, authenticated
with check (true);

drop policy if exists "DEV ONLY anon update provider_subscriptions" on public.provider_subscriptions;
create policy "DEV ONLY anon update provider_subscriptions"
on public.provider_subscriptions
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "DEV ONLY anon read club_team_members" on public.club_team_members;
create policy "DEV ONLY anon read club_team_members"
on public.club_team_members
for select
to anon, authenticated
using (true);

drop policy if exists "DEV ONLY anon read bookings" on public.bookings;
create policy "DEV ONLY anon read bookings"
on public.bookings
for select
to anon, authenticated
using (true);
