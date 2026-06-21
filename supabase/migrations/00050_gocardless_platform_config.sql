-- GoCardless platform configuration (singleton) + audit logs + payment fee columns

create table if not exists public.gocardless_platform_config (
  id integer primary key check (id = 1),
  environment text not null default 'sandbox'
    check (environment in ('sandbox', 'live')),
  access_token text,
  webhook_secret text,
  client_id text,
  client_secret text,
  redirect_uri text,
  callback_uri text,
  platform_enabled boolean not null default false,
  platform_fee_percent numeric(5, 2) not null default 2.5
    check (platform_fee_percent >= 0 and platform_fee_percent <= 10),
  connection_status text not null default 'not_configured'
    check (connection_status in (
      'not_configured',
      'sandbox_connected',
      'live_connected',
      'error'
    )),
  last_tested_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.admin_users (id) on delete set null
);

drop trigger if exists gocardless_platform_config_set_updated_at
  on public.gocardless_platform_config;
create trigger gocardless_platform_config_set_updated_at
  before update on public.gocardless_platform_config
  for each row execute function public.set_updated_at();

comment on table public.gocardless_platform_config is
  'Singleton GoCardless platform credentials and fee settings for Activora Direct Debit.';

insert into public.gocardless_platform_config (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.gocardless_platform_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null default 'info'
    check (level in ('info', 'warn', 'error')),
  event_type text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists gocardless_platform_logs_created_at_idx
  on public.gocardless_platform_logs (created_at desc);

comment on table public.gocardless_platform_logs is
  'Admin-visible GoCardless platform events (connection tests, webhooks, errors).';

alter table public.gocardless_payments
  add column if not exists gross_amount numeric(12, 2),
  add column if not exists processing_fee numeric(12, 2),
  add column if not exists platform_fee numeric(12, 2),
  add column if not exists net_amount numeric(12, 2);

update public.gocardless_payments
set
  gross_amount = coalesce(gross_amount, amount),
  processing_fee = coalesce(processing_fee, gocardless_fee),
  platform_fee = coalesce(platform_fee, activora_fee),
  net_amount = coalesce(net_amount, provider_net)
where gross_amount is null
   or processing_fee is null
   or platform_fee is null
   or net_amount is null;

alter table public.gocardless_platform_config enable row level security;
alter table public.gocardless_platform_logs enable row level security;
