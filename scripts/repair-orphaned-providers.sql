-- =============================================================================
-- Repair orphaned / hidden providers (production)
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor AFTER migration 00055.
--
-- Use when admin shows club_profiles but zero visible providers (e.g. CA Sport).
-- Restores lifecycle visibility for structurally complete providers:
--   auth user + club profile + active owner team member.
-- Does NOT hard-delete rows. Idempotent — safe to rerun.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Audit counts
-- ---------------------------------------------------------------------------
select 'providers' as table_name, count(*)::bigint as row_count from public.providers
union all
select 'club_profiles', count(*)::bigint from public.club_profiles
union all
select 'public_club_profiles', count(*)::bigint
from public.club_profiles
where published = true
   or visibility = 'published'::public.club_profile_visibility
union all
select 'sessions', count(*)::bigint from public.sessions
union all
select 'bookings', count(*)::bigint from public.bookings
union all
select 'club_team_members', count(*)::bigint from public.club_team_members
union all
select 'orphaned_club_profiles', count(*)::bigint
from public.club_profiles cp
where not exists (
  select 1 from public.providers p where p.id = cp.provider_id
);

-- ---------------------------------------------------------------------------
-- 2. Diagnostics per provider
-- ---------------------------------------------------------------------------
select
  p.id as provider_id,
  cp.id as club_profile_id,
  p.auth_user_id as owner_user_id,
  coalesce(nullif(trim(cp.public_slug), ''), nullif(trim(p.slug), '')) as slug,
  (p.lifecycle_status = 'deleted'::public.provider_lifecycle_status or p.deleted_at is not null) as is_deleted,
  (p.lifecycle_status <> 'active'::public.provider_lifecycle_status) as is_hidden,
  p.onboarding_completed as onboarding_complete,
  (cp.id is not null) as public_profile_exists,
  p.lifecycle_status,
  p.name as provider_name,
  cp.club_name,
  cp.published,
  cp.visibility,
  exists (
    select 1
    from public.club_team_members ctm
    where ctm.provider_id = p.id
      and ctm.is_owner = true
      and ctm.status = 'active'
  ) as has_active_owner,
  (select count(*) from public.sessions s where s.provider_id = p.id) as sessions_count
from public.providers p
left join public.club_profiles cp on cp.provider_id = p.id
order by p.name;

-- Orphaned club profiles (provider row missing)
select
  cp.id as club_profile_id,
  cp.provider_id,
  cp.club_name,
  cp.public_slug,
  cp.published,
  cp.visibility
from public.club_profiles cp
where not exists (
  select 1 from public.providers p where p.id = cp.provider_id
)
order by cp.club_name;

-- ---------------------------------------------------------------------------
-- 3. Restore visibility for structurally complete providers
-- ---------------------------------------------------------------------------
update public.providers p
set
  lifecycle_status = 'active'::public.provider_lifecycle_status,
  onboarding_completed = true,
  deleted_at = null,
  account_status = coalesce(nullif(trim(p.account_status), ''), 'active'),
  payments_enabled = true,
  payments_paused = false,
  updated_at = now()
where p.auth_user_id is not null
  and exists (
    select 1
    from public.club_profiles cp
    where cp.provider_id = p.id
      and trim(coalesce(cp.club_name, '')) <> ''
  )
  and exists (
    select 1
    from public.club_team_members ctm
    where ctm.provider_id = p.id
      and ctm.is_owner = true
      and ctm.status = 'active'
  )
  and (
    p.lifecycle_status <> 'active'::public.provider_lifecycle_status
    or p.onboarding_completed = false
    or p.deleted_at is not null
  );

-- ---------------------------------------------------------------------------
-- 4. Publish / sync public profiles (backward compatible with published_at)
-- ---------------------------------------------------------------------------
alter table public.club_profiles
  add column if not exists published_at timestamptz;

update public.club_profiles cp
set
  public_slug = coalesce(
    nullif(trim(cp.public_slug), ''),
    nullif(trim(p.slug), ''),
    lower(regexp_replace(trim(coalesce(cp.club_name, p.name)), '[^a-zA-Z0-9]+', '-', 'g'))
  ),
  club_name = coalesce(nullif(trim(cp.club_name), ''), p.name),
  email = coalesce(nullif(trim(cp.email), ''), coalesce(p.email, '')),
  phone = coalesce(nullif(trim(cp.phone), ''), coalesce(p.phone, '')),
  published = true,
  visibility = 'published'::public.club_profile_visibility,
  published_at = coalesce(cp.published_at, now()),
  updated_at = now()
from public.providers p
where p.id = cp.provider_id
  and p.lifecycle_status = 'active'::public.provider_lifecycle_status
  and (
    cp.public_slug is null
    or trim(cp.public_slug) = ''
    or cp.visibility = 'draft'::public.club_profile_visibility
    or cp.published = false
  );

update public.providers p
set
  slug = cp.public_slug,
  updated_at = now()
from public.club_profiles cp
where cp.provider_id = p.id
  and cp.public_slug is not null
  and trim(cp.public_slug) <> ''
  and (
    p.slug is null
    or trim(p.slug) = ''
    or trim(p.slug) <> trim(cp.public_slug)
  );

-- ---------------------------------------------------------------------------
-- 5. Republish activities for restored active providers
-- ---------------------------------------------------------------------------
update public.sessions s
set
  published = true,
  updated_at = now()
from public.providers p
where s.provider_id = p.id
  and p.lifecycle_status = 'active'::public.provider_lifecycle_status
  and coalesce(s.moderation_status, 'active') <> 'removed'
  and s.published = false;

-- ---------------------------------------------------------------------------
-- 6. Post-repair verification (expect CA Sport active with sessions visible)
-- ---------------------------------------------------------------------------
select
  p.id as provider_id,
  p.name,
  p.slug,
  p.lifecycle_status,
  p.onboarding_completed,
  p.deleted_at,
  cp.public_slug,
  cp.published,
  cp.visibility,
  (select count(*) from public.sessions s where s.provider_id = p.id) as sessions_count
from public.providers p
left join public.club_profiles cp on cp.provider_id = p.id
where lower(coalesce(p.name, cp.club_name, '')) like '%ca sport%'
   or lower(coalesce(p.slug, cp.public_slug, '')) like '%ca-sport%'
order by p.name;
