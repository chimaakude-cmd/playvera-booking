-- Club profile visibility + public read for published club pages

create type public.club_profile_visibility as enum (
  'draft',
  'published',
  'hidden'
);

alter table public.club_profiles
  add column if not exists visibility public.club_profile_visibility
    not null default 'draft';

comment on column public.club_profiles.visibility is
  'draft: provider only | published: public + discoverable | hidden: direct link only';

-- Backfill visibility from legacy published flag
update public.club_profiles
set visibility = case
  when published then 'published'::public.club_profile_visibility
  else 'draft'::public.club_profile_visibility
end
where visibility = 'draft'::public.club_profile_visibility
  and published = true;

-- ---------------------------------------------------------------------------
-- Public read for parent-facing club pages (anon + authenticated)
-- ---------------------------------------------------------------------------

grant select on table public.club_profiles to anon;
grant select, insert, update, delete on table public.club_profile_locations to authenticated, service_role;
grant select on table public.club_profile_locations to anon;

drop policy if exists "DEV ONLY anon read club_profiles" on public.club_profiles;
drop policy if exists "DEV ONLY anon update club_profiles" on public.club_profiles;

drop policy if exists "public_read_published_club_profiles" on public.club_profiles;
create policy "public_read_published_club_profiles"
on public.club_profiles
for select
to anon, authenticated
using (
  visibility in ('published', 'hidden')
  and public_slug is not null
);

-- Locations for publicly visible profiles
alter table public.club_profile_locations enable row level security;

drop policy if exists "owner_manage_club_profile_locations" on public.club_profile_locations;
create policy "owner_manage_club_profile_locations"
on public.club_profile_locations
for all
to authenticated
using (
  exists (
    select 1
    from public.club_profiles cp
    join public.providers p on p.id = cp.provider_id
    where cp.id = club_profile_id
      and p.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.club_profiles cp
    join public.providers p on p.id = cp.provider_id
    where cp.id = club_profile_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "public_read_club_profile_locations" on public.club_profile_locations;
create policy "public_read_club_profile_locations"
on public.club_profile_locations
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.club_profiles cp
    where cp.id = club_profile_id
      and cp.visibility in ('published', 'hidden')
      and cp.public_slug is not null
  )
);
