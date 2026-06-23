-- Stripe platform admin: audit logs + webhook health state (singleton)

create table if not exists public.stripe_platform_state (
  id integer primary key check (id = 1),
  connection_status text not null default 'not_configured'
    check (connection_status in (
      'not_configured',
      'test_connected',
      'live_connected',
      'error'
    )),
  last_tested_at timestamptz,
  last_error text,
  last_webhook_received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists stripe_platform_state_set_updated_at
  on public.stripe_platform_state;
create trigger stripe_platform_state_set_updated_at
  before update on public.stripe_platform_state
  for each row execute function public.set_updated_at();

comment on table public.stripe_platform_state is
  'Singleton Stripe platform connection and webhook health timestamps for Activora admin.';

insert into public.stripe_platform_state (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.stripe_platform_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null default 'info'
    check (level in ('info', 'warn', 'error')),
  event_type text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists stripe_platform_logs_created_at_idx
  on public.stripe_platform_logs (created_at desc);

comment on table public.stripe_platform_logs is
  'Admin-visible Stripe platform events (connection tests, webhooks, errors).';

alter table public.stripe_platform_state enable row level security;
alter table public.stripe_platform_logs enable row level security;
