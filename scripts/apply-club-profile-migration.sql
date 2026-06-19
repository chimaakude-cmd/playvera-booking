-- =============================================================================
-- Playvera / Activora — Club profile save/publish production fix
-- =============================================================================
-- Paste this ENTIRE file into Supabase Dashboard → SQL Editor → Run.
--
-- Fixes: "Could not find the 'social_links' column of 'club_profiles' in the
-- schema cache" when saving or publishing a club profile.
--
-- Consolidates migrations:
--   00009_club_profile_contact_social.sql (contact, social_links, verification_status)
--   00045_club_profile_visibility_public.sql (visibility column only — RLS below optional)
--
-- Prerequisites:
--   - Base schema applied (club_profiles from 00008_club_profiles.sql)
--
-- After running:
--   1. Confirm social_links, contact, verification_status, visibility columns exist
--   2. In Supabase Dashboard → Settings → API, click "Reload schema" if PostgREST cache stale
--   3. Redeploy the app (or wait for schema cache refresh)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 00009 — contact, social_links, verification_status
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'club_verification_status'
  ) then
    create type public.club_verification_status as enum (
      'unverified',
      'verified',
      'premium_verified'
    );
  end if;
end $$;

alter table public.club_profiles
  add column if not exists contact jsonb not null default '{}'::jsonb,
  add column if not exists social_links jsonb not null default '{}'::jsonb,
  add column if not exists verification_status public.club_verification_status
    not null default 'unverified';

comment on column public.club_profiles.contact is
  'Contact methods: email (required), phone, whatsapp, website.';

comment on column public.club_profiles.social_links is
  'Canonical social profile URLs keyed by platform. Empty object when none set.';

comment on column public.club_profiles.verification_status is
  'Trust state for future ownership verification workflows.';

-- ---------------------------------------------------------------------------
-- 00045 — visibility column (public read policies may already exist from onboarding)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'club_profile_visibility'
  ) then
    create type public.club_profile_visibility as enum (
      'draft',
      'published',
      'hidden'
    );
  end if;
end $$;

alter table public.club_profiles
  add column if not exists visibility public.club_profile_visibility
    not null default 'draft';

comment on column public.club_profiles.visibility is
  'draft: provider only | published: public + discoverable | hidden: direct link only';

update public.club_profiles
set visibility = case
  when published then 'published'::public.club_profile_visibility
  else 'draft'::public.club_profile_visibility
end
where visibility = 'draft'::public.club_profile_visibility
  and published = true;

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------

select
  column_name,
  data_type,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'club_profiles'
  and column_name in (
    'contact',
    'social_links',
    'verification_status',
    'visibility',
    'media_gallery',
    'branding',
    'customer_view'
  )
order by column_name;
