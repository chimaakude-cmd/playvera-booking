-- =============================================================================
-- Safe cleanup for incomplete test provider registrations
-- =============================================================================
-- Run in Supabase Dashboard -> SQL Editor AFTER applying migration
-- 00055_provider_lifecycle_status.sql
--
-- PROTECTED: CA Sport (and any provider matching ca-sport / CA Sport by name)
-- ACTION: Marks incomplete partial test rows as abandoned (soft cleanup).
-- Does NOT hard-delete rows or touch active providers.
-- =============================================================================

select
  p.id,
  p.name,
  p.slug,
  p.email,
  p.lifecycle_status,
  p.onboarding_completed,
  p.auth_user_id,
  cp.club_name,
  exists (
    select 1
    from public.club_team_members ctm
    where ctm.provider_id = p.id
      and ctm.is_owner = true
      and ctm.status = 'active'
  ) as has_active_owner
from public.providers p
left join public.club_profiles cp on cp.provider_id = p.id
where p.lifecycle_status = 'incomplete'
  and p.onboarding_completed = false
  and lower(coalesce(p.name, '')) not like '%ca sport%'
  and lower(coalesce(p.slug, '')) not in ('ca-sport', 'ca-sports')
  and lower(coalesce(cp.club_name, '')) not like '%ca sport%'
order by p.created_at;

update public.providers p
set
  lifecycle_status = 'abandoned'::public.provider_lifecycle_status,
  onboarding_completed = false,
  updated_at = now()
where p.lifecycle_status = 'incomplete'
  and p.onboarding_completed = false
  and lower(coalesce(p.name, '')) not like '%ca sport%'
  and lower(coalesce(p.slug, '')) not in ('ca-sport', 'ca-sports')
  and not exists (
    select 1
    from public.club_profiles cp
    where cp.provider_id = p.id
      and lower(coalesce(cp.club_name, '')) like '%ca sport%'
  );

select
  p.id,
  p.name,
  p.slug,
  p.lifecycle_status,
  p.onboarding_completed,
  cp.club_name
from public.providers p
left join public.club_profiles cp on cp.provider_id = p.id
where lower(coalesce(p.name, cp.club_name, '')) like '%ca sport%'
   or lower(coalesce(p.slug, cp.public_slug, '')) like '%ca-sport%';
