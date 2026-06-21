-- Platform-managed payment controls per provider + audit log + platform webhook timestamp

alter table public.providers
  add column if not exists payments_enabled boolean not null default true,
  add column if not exists payments_paused boolean not null default false,
  add column if not exists payout_schedule text not null default 'weekly',
  add column if not exists platform_fee_override_percent numeric(5, 2),
  add column if not exists payment_internal_notes text,
  add column if not exists payment_model text not null default 'platform_managed';

alter table public.providers
  drop constraint if exists providers_payout_schedule_check;

alter table public.providers
  add constraint providers_payout_schedule_check
  check (payout_schedule in ('daily', 'weekly', 'monthly'));

alter table public.providers
  drop constraint if exists providers_payment_model_check;

alter table public.providers
  add constraint providers_payment_model_check
  check (payment_model in ('platform_managed', 'club_oauth'));

alter table public.providers
  drop constraint if exists providers_platform_fee_override_percent_check;

alter table public.providers
  add constraint providers_platform_fee_override_percent_check
  check (
    platform_fee_override_percent is null
    or (platform_fee_override_percent >= 0 and platform_fee_override_percent <= 10)
  );

comment on column public.providers.payments_enabled is
  'When false, club cannot accept new parent payments.';
comment on column public.providers.payments_paused is
  'Admin pause — blocks new payments while preserving existing mandates.';
comment on column public.providers.payout_schedule is
  'Club payout cadence: daily | weekly | monthly.';
comment on column public.providers.platform_fee_override_percent is
  'Optional admin override for Activora platform fee on this club.';
comment on column public.providers.payment_model is
  'platform_managed = Activora handles GoCardless; club_oauth = legacy club connect.';

alter table public.gocardless_platform_config
  add column if not exists last_webhook_received_at timestamptz;

create table if not exists public.provider_payment_audit_log (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  admin_user_id uuid references public.admin_users (id) on delete set null,
  action text not null,
  previous_values jsonb not null default '{}'::jsonb,
  new_values jsonb not null default '{}'::jsonb,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists provider_payment_audit_log_provider_id_idx
  on public.provider_payment_audit_log (provider_id, created_at desc);

comment on table public.provider_payment_audit_log is
  'Audit trail for admin payment control changes on providers.';

-- Backfill platform-managed clubs on live GoCardless platform
update public.providers
set
  payment_model = 'platform_managed',
  gocardless_status = case
    when gocardless_status in ('connected', 'pending_setup', 'action_required')
      then gocardless_status
    else 'connected'
  end,
  payment_method_gocardless_dd = true,
  preferred_payment_provider = 'gocardless'
where payment_model = 'platform_managed'
  or gocardless_status = 'not_connected';
