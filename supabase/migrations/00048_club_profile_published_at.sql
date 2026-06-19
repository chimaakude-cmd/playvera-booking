-- Track when a club profile was first published (Save & publish / onboarding)

alter table public.club_profiles
  add column if not exists published_at timestamptz;

comment on column public.club_profiles.published_at is
  'Timestamp when the profile was first published (visibility published or hidden).';

-- Backfill published_at for live profiles
update public.club_profiles
set published_at = coalesce(published_at, updated_at, created_at, now())
where visibility in ('published', 'hidden')
  and published_at is null;

-- Sync visibility from legacy published flag (idempotent)
update public.club_profiles
set visibility = case
  when published then 'published'::public.club_profile_visibility
  else 'draft'::public.club_profile_visibility
end
where visibility = 'draft'::public.club_profile_visibility
  and published = true;
