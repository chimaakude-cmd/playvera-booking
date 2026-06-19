-- =============================================================================
-- Playvera / Activora — Club onboarding production fix
-- =============================================================================
-- Paste this ENTIRE file into Supabase Dashboard → SQL Editor → Run.
--
-- Fixes: "permission denied for table providers" during club onboarding Launch.
--
-- Consolidates migrations:
--   00043_club_onboarding_production.sql
--   00044_providers_rls_authenticated.sql
--
-- Prerequisites:
--   - Base schema 00001_activora_schema.sql applied (providers, club_profiles, etc.)
--
-- After running:
--   1. Confirm providers.auth_user_id column exists
--   2. Set SUPABASE_SERVICE_ROLE_KEY on Vercel (Production) for auth.admin.createUser
--   3. Redeploy the app
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 00043 — Link providers to Supabase Auth owners
-- ---------------------------------------------------------------------------

alter table public.providers
  add column if not exists auth_user_id uuid;

create unique index if not exists providers_auth_user_id_idx
  on public.providers (auth_user_id)
  where auth_user_id is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'providers_auth_user_id_fkey'
  ) then
    alter table public.providers
      add constraint providers_auth_user_id_fkey
      foreign key (auth_user_id) references auth.users (id) on delete set null;
  end if;
end $$;

comment on column public.providers.auth_user_id is
  'Supabase Auth user id for the club owner account created during onboarding.';

-- Dev insert policies for related tables (00032/00043) — kept for local; production
-- onboarding uses authenticated policies below.
drop policy if exists "DEV ONLY anon insert club_profiles" on public.club_profiles;
create policy "DEV ONLY anon insert club_profiles"
on public.club_profiles
for insert
to anon, authenticated
with check (true);

drop policy if exists "DEV ONLY anon insert club_team_members" on public.club_team_members;
create policy "DEV ONLY anon insert club_team_members"
on public.club_team_members
for insert
to anon, authenticated
with check (true);

-- ---------------------------------------------------------------------------
-- 00044 — Production grants + authenticated RLS for club onboarding
-- ---------------------------------------------------------------------------

grant usage on schema public to authenticated, service_role;

grant select, insert, update on table public.providers to authenticated, service_role;
grant select, insert, update on table public.club_profiles to authenticated, service_role;
grant select, insert, update on table public.provider_subscriptions to authenticated, service_role;
grant select, insert, update, delete on table public.club_team_members to authenticated, service_role;

alter table public.providers enable row level security;

drop policy if exists "authenticated_insert_provider" on public.providers;
create policy "authenticated_insert_provider"
on public.providers
for insert
to authenticated
with check (auth.uid() = auth_user_id);

drop policy if exists "authenticated_select_provider" on public.providers;
create policy "authenticated_select_provider"
on public.providers
for select
to authenticated
using (auth.uid() = auth_user_id);

drop policy if exists "authenticated_update_provider" on public.providers;
create policy "authenticated_update_provider"
on public.providers
for update
to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

alter table public.club_profiles enable row level security;

drop policy if exists "authenticated_insert_club_profile" on public.club_profiles;
create policy "authenticated_insert_club_profile"
on public.club_profiles
for insert
to authenticated
with check (
  exists (
    select 1
    from public.providers p
    where p.id = provider_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "authenticated_select_club_profile" on public.club_profiles;
create policy "authenticated_select_club_profile"
on public.club_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.providers p
    where p.id = provider_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "authenticated_update_club_profile" on public.club_profiles;
create policy "authenticated_update_club_profile"
on public.club_profiles
for update
to authenticated
using (
  exists (
    select 1
    from public.providers p
    where p.id = provider_id
      and p.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.providers p
    where p.id = provider_id
      and p.auth_user_id = auth.uid()
  )
);

alter table public.provider_subscriptions enable row level security;

drop policy if exists "authenticated_insert_provider_subscription" on public.provider_subscriptions;
create policy "authenticated_insert_provider_subscription"
on public.provider_subscriptions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.providers p
    where p.id = provider_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "authenticated_select_provider_subscription" on public.provider_subscriptions;
create policy "authenticated_select_provider_subscription"
on public.provider_subscriptions
for select
to authenticated
using (
  exists (
    select 1
    from public.providers p
    where p.id = provider_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "authenticated_update_provider_subscription" on public.provider_subscriptions;
create policy "authenticated_update_provider_subscription"
on public.provider_subscriptions
for update
to authenticated
using (
  exists (
    select 1
    from public.providers p
    where p.id = provider_id
      and p.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.providers p
    where p.id = provider_id
      and p.auth_user_id = auth.uid()
  )
);

alter table public.club_team_members enable row level security;

drop policy if exists "authenticated_insert_club_team_member" on public.club_team_members;
create policy "authenticated_insert_club_team_member"
on public.club_team_members
for insert
to authenticated
with check (
  auth_user_id = auth.uid()
  and exists (
    select 1
    from public.providers p
    where p.id = provider_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "authenticated_select_club_team_member" on public.club_team_members;
create policy "authenticated_select_club_team_member"
on public.club_team_members
for select
to authenticated
using (
  auth_user_id = auth.uid()
  or exists (
    select 1
    from public.providers p
    where p.id = provider_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "authenticated_update_club_team_member" on public.club_team_members;
create policy "authenticated_update_club_team_member"
on public.club_team_members
for update
to authenticated
using (
  auth_user_id = auth.uid()
  or exists (
    select 1
    from public.providers p
    where p.id = provider_id
      and p.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.providers p
    where p.id = provider_id
      and p.auth_user_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------

select
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'providers'
  and column_name = 'auth_user_id';

select policyname, tablename, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in (
    'providers',
    'club_profiles',
    'provider_subscriptions',
    'club_team_members'
  )
  and policyname like 'authenticated_%'
order by tablename, policyname;

-- ---------------------------------------------------------------------------
-- 00046 — Franchise guardrails (managed_by_franchisor)
-- See also: scripts/fix-ch-sports-franchise.sql
-- ---------------------------------------------------------------------------

alter table public.providers
  add column if not exists managed_by_franchisor boolean not null default false;

comment on column public.providers.managed_by_franchisor is
  'When true and parent_provider_id is set, the club is managed by the franchisor parent provider.';
