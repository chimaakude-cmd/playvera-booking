-- Production RLS + grants for club onboarding (authenticated club owners)
-- Replaces permissive DEV policies with auth_user_id-scoped access.

-- ---------------------------------------------------------------------------
-- Table privileges (fixes "permission denied for table providers" in production)
-- ---------------------------------------------------------------------------

grant usage on schema public to authenticated, service_role;

grant select, insert, update on table public.providers to authenticated, service_role;
grant select, insert, update on table public.club_profiles to authenticated, service_role;
grant select, insert, update on table public.provider_subscriptions to authenticated, service_role;
grant select, insert, update, delete on table public.club_team_members to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- providers — owner scoped to auth_user_id
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- club_profiles — owner via providers.auth_user_id
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- provider_subscriptions — owner via providers.auth_user_id
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- club_team_members — owner row linked to auth.uid()
-- ---------------------------------------------------------------------------

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
