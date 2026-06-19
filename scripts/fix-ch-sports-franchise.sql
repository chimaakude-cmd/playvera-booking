-- =============================================================================
-- Fix independent clubs incorrectly linked to a franchisor (e.g. CH Sports)
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor after 00046_provider_managed_by_franchisor.sql
--
-- Clears franchise fields so the club dashboard no longer shows the franchisor
-- managed banner for self-service onboarded clubs.
-- =============================================================================

-- Ensure column exists (safe if migration 00046 already applied)
alter table public.providers
  add column if not exists managed_by_franchisor boolean not null default false;

update public.providers p
set
  organisation_type = 'club',
  parent_provider_id = null,
  managed_by_franchisor = false,
  updated_at = now()
where
  p.name ilike '%CH Sports%'
  or p.slug ilike '%ch-sports%'
  or exists (
    select 1
    from public.club_profiles cp
    where cp.provider_id = p.id
      and cp.club_name ilike '%CH Sports%'
  );

-- Optional: reset any club onboarded via self-service that was incorrectly flagged
-- (no parent, but managed_by_franchisor was true)
update public.providers
set managed_by_franchisor = false,
    updated_at = now()
where managed_by_franchisor = true
  and parent_provider_id is null;

select
  p.id,
  p.name,
  p.slug,
  p.organisation_type,
  p.parent_provider_id,
  p.managed_by_franchisor
from public.providers p
left join public.club_profiles cp on cp.provider_id = p.id
where p.name ilike '%CH Sports%'
   or cp.club_name ilike '%CH Sports%'
   or p.slug ilike '%ch-sports%';
