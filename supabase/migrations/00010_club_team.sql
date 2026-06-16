-- Club team members and invites

create type public.club_team_role as enum (
  'coach',
  'administrator',
  'manager',
  'owner'
);

create type public.club_team_member_status as enum (
  'active',
  'pending'
);

create type public.club_team_invite_status as enum (
  'pending',
  'cancelled',
  'accepted'
);

create table if not exists public.club_team_members (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  auth_user_id uuid,
  first_name text not null default '',
  last_name text not null default '',
  email text not null,
  role public.club_team_role not null default 'coach',
  status public.club_team_member_status not null default 'active',
  is_owner boolean not null default false,
  last_active_at timestamptz,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id, email)
);

create index if not exists club_team_members_provider_id_idx
  on public.club_team_members (provider_id);

create trigger club_team_members_set_updated_at
  before update on public.club_team_members
  for each row execute function public.set_updated_at();

create table if not exists public.club_team_invites (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null,
  role public.club_team_role not null,
  note text not null default '',
  status public.club_team_invite_status not null default 'pending',
  invited_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists club_team_invites_provider_id_idx
  on public.club_team_invites (provider_id);

create trigger club_team_invites_set_updated_at
  before update on public.club_team_invites
  for each row execute function public.set_updated_at();

comment on table public.club_team_members is
  'Staff members with standardised Activora club roles.';

comment on table public.club_team_invites is
  'Pending staff invitations. Owner role is never invited.';
