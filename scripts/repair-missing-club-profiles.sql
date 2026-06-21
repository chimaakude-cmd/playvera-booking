-- =============================================================================
-- Repair missing or non-public club_profiles for existing providers
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor.
--
-- Creates a published club_profiles row for every provider that lacks one,
-- or upgrades draft / empty-slug profiles so /clubs/[slug] resolves.
-- Syncs providers.slug to club_profiles.public_slug.
-- =============================================================================

insert into public.club_profiles (
  provider_id,
  club_name,
  public_slug,
  tagline,
  short_description,
  long_description,
  meta_title,
  meta_description,
  categories,
  age_ranges,
  email,
  phone,
  verified,
  published,
  visibility,
  published_at
)
select
  p.id as provider_id,
  p.name as club_name,
  coalesce(
    nullif(trim(p.slug), ''),
    lower(regexp_replace(trim(p.name), '[^a-zA-Z0-9]+', '-', 'g'))
  ) as public_slug,
  '' as tagline,
  coalesce(
    nullif(trim(p.name), '') || ' offers children''s activities and clubs.',
    'Children''s activities and clubs.'
  ) as short_description,
  coalesce(
    nullif(trim(p.name), '') || ' offers children''s activities and clubs.',
    'Children''s activities and clubs.'
  ) as long_description,
  coalesce(nullif(trim(p.name), ''), 'Club') || ' | Activeora' as meta_title,
  coalesce(
    nullif(trim(p.name), '') || ' offers children''s activities and clubs.',
    'Children''s activities and clubs.'
  ) as meta_description,
  '{}'::jsonb as categories,
  '[]'::jsonb as age_ranges,
  coalesce(p.email, '') as email,
  coalesce(p.phone, '') as phone,
  false as verified,
  true as published,
  'published'::public.club_profile_visibility as visibility,
  now() as published_at
from public.providers p
where p.name is not null
  and trim(p.name) <> ''
  and not exists (
    select 1
    from public.club_profiles cp
    where cp.provider_id = p.id
  )
on conflict (provider_id) do nothing;

-- Upgrade existing profiles missing a public slug or still in draft
update public.club_profiles cp
set
  public_slug = coalesce(
    nullif(trim(cp.public_slug), ''),
    nullif(trim(p.slug), ''),
    lower(regexp_replace(trim(p.name), '[^a-zA-Z0-9]+', '-', 'g'))
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
  and (
    cp.public_slug is null
    or trim(cp.public_slug) = ''
    or cp.visibility = 'draft'::public.club_profile_visibility
    or cp.published = false
  );

-- Keep provider slug aligned with the canonical public profile slug
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
    or p.slug <> cp.public_slug
  );

-- Report clubs still missing a usable public slug (should be empty)
select
  p.id as provider_id,
  p.name as provider_name,
  p.slug as provider_slug,
  cp.id as club_profile_id,
  cp.public_slug,
  cp.visibility,
  cp.published
from public.providers p
left join public.club_profiles cp on cp.provider_id = p.id
where cp.id is null
   or cp.public_slug is null
   or trim(cp.public_slug) = ''
   or cp.visibility = 'draft'::public.club_profile_visibility
order by p.name;

-- Slug mismatches between providers and club_profiles (e.g. CA Sport)
select
  p.id as provider_id,
  p.name,
  p.slug as provider_slug,
  cp.public_slug as profile_slug,
  cp.visibility,
  cp.published
from public.providers p
join public.club_profiles cp on cp.provider_id = p.id
where p.slug is not null
  and cp.public_slug is not null
  and trim(p.slug) <> trim(cp.public_slug)
order by p.name;

-- Restore lifecycle visibility for structurally complete providers (00055+)
update public.providers p
set
  lifecycle_status = 'active'::public.provider_lifecycle_status,
  onboarding_completed = true,
  deleted_at = null,
  updated_at = now()
where p.auth_user_id is not null
  and exists (
    select 1
    from public.club_profiles cp
    where cp.provider_id = p.id
      and trim(coalesce(cp.club_name, '')) <> ''
  )
  and (
    p.lifecycle_status <> 'active'::public.provider_lifecycle_status
    or p.onboarding_completed = false
    or p.deleted_at is not null
  );
