-- Audit log for provider/club account deletions (finance records retained).

create table if not exists public.provider_deletion_audit_log (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete restrict,
  actor_id text not null,
  actor_type text not null check (actor_type in ('admin', 'club_owner')),
  actor_email text,
  finance_records_retained boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_provider_deletion_audit_provider_id
  on public.provider_deletion_audit_log (provider_id, created_at desc);

comment on table public.provider_deletion_audit_log is
  'Records admin and club-initiated provider deletions; payment/payout rows are retained.';

grant select, insert on table public.provider_deletion_audit_log to service_role;

alter table public.provider_deletion_audit_log enable row level security;

-- Re-sync lifecycle for clubs that were live before onboarding_completed existed.
update public.providers p
set
  onboarding_completed = true,
  lifecycle_status = 'active'::public.provider_lifecycle_status
where p.lifecycle_status = 'incomplete'
  and p.deleted_at is null
  and p.auth_user_id is not null
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
  );
