-- =============================================================================
-- CA Sport — one-off club profile publish repair
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor when /clubs/ca-sport returns not found
-- but the club profile exists in the dashboard.
-- Idempotent — safe to rerun.
-- =============================================================================

-- Audit before repair
select
  p.id as provider_id,
  p.name,
  p.slug as provider_slug,
  p.lifecycle_status,
  p.onboarding_completed,
  p.deleted_at,
  cp.id as club_profile_id,
  cp.public_slug,
  cp.published,
  cp.visibility
from public.providers p
left join public.club_profiles cp on cp.provider_id = p.id
where lower(coalesce(p.name, cp.club_name, '')) like '%ca sport%'
   or lower(coalesce(p.slug, cp.public_slug, '')) like '%ca-sport%';

-- Restore provider lifecycle
update public.providers p
set
  lifecycle_status = 'active'::public.provider_lifecycle_status,
  onboarding_completed = true,
  deleted_at = null,
  account_status = coalesce(nullif(trim(p.account_status), ''), 'active'),
  updated_at = now()
where (
    lower(coalesce(p.name, '')) like '%ca sport%'
    or lower(coalesce(p.slug, '')) like '%ca-sport%'
  )
  and p.auth_user_id is not null
  and exists (
    select 1 from public.club_profiles cp where cp.provider_id = p.id
  );

-- Publish profile + sync slug (schema-aware: visibility + published_at when present)
alter table public.club_profiles
  add column if not exists published_at timestamptz;

update public.club_profiles cp
set
  public_slug = coalesce(
    nullif(trim(cp.public_slug), ''),
    nullif(trim(p.slug), ''),
    'ca-sport'
  ),
  club_name = coalesce(nullif(trim(cp.club_name), ''), p.name),
  published = true,
  visibility = 'published'::public.club_profile_visibility,
  published_at = coalesce(cp.published_at, now()),
  updated_at = now()
from public.providers p
where p.id = cp.provider_id
  and (
    lower(coalesce(p.name, cp.club_name, '')) like '%ca sport%'
    or lower(coalesce(p.slug, cp.public_slug, '')) like '%ca-sport%'
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
    lower(coalesce(p.name, cp.club_name, '')) like '%ca sport%'
    or lower(coalesce(p.slug, cp.public_slug, '')) like '%ca-sport%'
  )
  and (p.slug is null or trim(p.slug) <> trim(cp.public_slug));

-- Verify anon-readable (visibility published + slug set)
select
  p.name,
  p.slug,
  p.lifecycle_status,
  cp.public_slug,
  cp.published,
  cp.visibility,
  (
    cp.visibility in ('published', 'hidden')
    and cp.public_slug is not null
    and trim(cp.public_slug) <> ''
  ) as anon_readable
from public.providers p
join public.club_profiles cp on cp.provider_id = p.id
where lower(coalesce(p.slug, cp.public_slug, '')) like '%ca-sport%';
