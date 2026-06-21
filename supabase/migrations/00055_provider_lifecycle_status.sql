-- Provider lifecycle status for admin visibility and cleanup of partial registrations.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'provider_lifecycle_status') then
    create type public.provider_lifecycle_status as enum (
      'active',
      'incomplete',
      'abandoned',
      'deleted'
    );
  end if;
end $$;

alter table public.providers
  add column if not exists lifecycle_status public.provider_lifecycle_status not null default 'incomplete',
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists deleted_at timestamptz;

comment on column public.providers.lifecycle_status is
  'Admin lifecycle: active (visible), incomplete, abandoned, or deleted.';

comment on column public.providers.onboarding_completed is
  'True when club onboarding finished (owner, profile, subscription saved).';

comment on column public.providers.deleted_at is
  'Soft-delete timestamp when lifecycle_status is deleted.';

create index if not exists idx_providers_lifecycle_status
  on public.providers (lifecycle_status);

update public.providers p
set
  onboarding_completed = (
    p.auth_user_id is not null
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
  ),
  lifecycle_status = case
    when p.lifecycle_status in ('abandoned', 'deleted') then p.lifecycle_status
    when p.auth_user_id is not null
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
      then 'active'::public.provider_lifecycle_status
    else 'incomplete'::public.provider_lifecycle_status
  end
where p.lifecycle_status is distinct from 'abandoned'
  and p.lifecycle_status is distinct from 'deleted';
