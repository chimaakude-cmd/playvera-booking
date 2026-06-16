-- Club accountant access and bookkeeping integrations

create type public.accountant_invite_status as enum (
  'pending',
  'active'
);

create type public.bookkeeping_provider as enum (
  'quickbooks',
  'freeagent',
  'xero',
  'sage'
);

create table public.club_accountant_access (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  accountant_name text not null,
  accountant_email text not null,
  firm_name text not null,
  phone text,
  status public.accountant_invite_status not null default 'pending',
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  last_active_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index club_accountant_access_active_club_idx
  on public.club_accountant_access (club_id)
  where removed_at is null and status = 'active';

create table public.club_bookkeeping_integrations (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  provider public.bookkeeping_provider not null,
  status text not null default 'not_connected',
  connected_at timestamptz,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  unique (club_id, provider)
);

-- Extend accounting_integration enum from 00011 if present
alter type public.accounting_integration add value if not exists 'sage';

create index club_accountant_access_club_id_idx
  on public.club_accountant_access (club_id);

create index club_bookkeeping_integrations_club_id_idx
  on public.club_bookkeeping_integrations (club_id);
