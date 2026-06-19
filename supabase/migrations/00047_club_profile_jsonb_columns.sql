-- Club profile JSONB columns missing on production (00009 + visibility from 00045)
--
-- Production may have base club_profiles (00008) without contact/social_links/
-- verification_status/visibility. Profile save/publish fails with:
--   Could not find the 'social_links' column of 'club_profiles' in the schema cache
--
-- Run via Supabase CLI or paste scripts/apply-club-profile-migration.sql in SQL Editor.

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

-- Visibility enum + column (00045) — idempotent for production that skipped it
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

-- Backfill visibility from legacy published flag
update public.club_profiles
set visibility = case
  when published then 'published'::public.club_profile_visibility
  else 'draft'::public.club_profile_visibility
end
where visibility = 'draft'::public.club_profile_visibility
  and published = true;
