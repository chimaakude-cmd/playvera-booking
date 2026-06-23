-- Stripe platform configuration (singleton) + fix RLS/grants on admin tables.
-- Mirrors gocardless_platform_config (00050) and gocardless RLS fix (00051).

create table if not exists public.stripe_platform_config (
  id integer primary key check (id = 1),
  environment text not null default 'test'
    check (environment in ('test', 'live')),
  secret_key text,
  publishable_key text,
  webhook_secret text,
  platform_enabled boolean not null default false,
  platform_fee_percent numeric(5, 2) not null default 2.5
    check (platform_fee_percent >= 0 and platform_fee_percent <= 10),
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
  updated_at timestamptz not null default now(),
  updated_by uuid references public.admin_users (id) on delete set null
);

drop trigger if exists stripe_platform_config_set_updated_at
  on public.stripe_platform_config;
create trigger stripe_platform_config_set_updated_at
  before update on public.stripe_platform_config
  for each row execute function public.set_updated_at();

comment on table public.stripe_platform_config is
  'Singleton Stripe platform credentials and fee settings for Activora card payments.';

insert into public.stripe_platform_config (
  id,
  connection_status,
  last_tested_at,
  last_error,
  last_webhook_received_at
)
select
  id,
  connection_status,
  last_tested_at,
  last_error,
  last_webhook_received_at
from public.stripe_platform_state
where id = 1
on conflict (id) do update set
  connection_status = excluded.connection_status,
  last_tested_at = coalesce(excluded.last_tested_at, stripe_platform_config.last_tested_at),
  last_error = coalesce(excluded.last_error, stripe_platform_config.last_error),
  last_webhook_received_at = coalesce(
    excluded.last_webhook_received_at,
    stripe_platform_config.last_webhook_received_at
  );

insert into public.stripe_platform_config (id)
values (1)
on conflict (id) do nothing;

-- RLS was enabled in 00059 without grants or policies, causing permission denied.
-- Access is server-only via SUPABASE_SERVICE_ROLE_KEY + admin auth on API routes.

alter table public.stripe_platform_config disable row level security;
alter table public.stripe_platform_state disable row level security;
alter table public.stripe_platform_logs disable row level security;

grant all on table public.stripe_platform_config to service_role;
grant all on table public.stripe_platform_state to service_role;
grant all on table public.stripe_platform_logs to service_role;

grant all on table public.stripe_platform_config to authenticated;
grant all on table public.stripe_platform_state to authenticated;
grant all on table public.stripe_platform_logs to authenticated;
