-- Club OAuth payment model: ensure provider payment columns exist, default to club_oauth.
-- Idempotent; safe on prod where 00014, 00029, or 00052 may not have applied.
-- Follows the defensive information_schema pattern from 00057.

-- ---------------------------------------------------------------------------
-- 1. Stripe Connect columns (from 00014, if missing)
-- ---------------------------------------------------------------------------

alter table public.providers
  add column if not exists stripe_connect_status text not null default 'not_connected',
  add column if not exists stripe_charges_enabled boolean not null default false,
  add column if not exists stripe_payouts_enabled boolean not null default false,
  add column if not exists stripe_details_submitted boolean not null default false,
  add column if not exists stripe_disabled_reason text,
  add column if not exists stripe_requirements_due jsonb not null default '[]'::jsonb,
  add column if not exists stripe_connected_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. GoCardless / payment-provider columns (from 00029, if missing)
-- ---------------------------------------------------------------------------

alter table public.providers
  add column if not exists gocardless_status text not null default 'not_connected',
  add column if not exists gocardless_organisation_id text,
  add column if not exists gocardless_merchant_id text,
  add column if not exists gocardless_connected_at timestamptz,
  add column if not exists preferred_payment_provider text not null default 'stripe',
  add column if not exists payment_method_stripe_card boolean not null default true,
  add column if not exists payment_method_gocardless_dd boolean not null default false,
  add column if not exists payment_method_manual_invoice boolean not null default false;

-- ---------------------------------------------------------------------------
-- 3. Provider payment control columns (from 00052, if missing)
-- ---------------------------------------------------------------------------

alter table public.providers
  add column if not exists payments_enabled boolean not null default true,
  add column if not exists payments_paused boolean not null default false,
  add column if not exists payout_schedule text not null default 'weekly',
  add column if not exists platform_fee_override_percent numeric(5, 2),
  add column if not exists payment_internal_notes text,
  add column if not exists payment_model text not null default 'club_oauth';

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
  'club_oauth = club connects GoCardless via OAuth; platform_managed = Activora-operated mandates.';

-- ---------------------------------------------------------------------------
-- 4. Audit log + platform webhook timestamp (from 00052, if missing)
-- ---------------------------------------------------------------------------

do $migrate$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'gocardless_platform_config'
  ) then
    alter table public.gocardless_platform_config
      add column if not exists last_webhook_received_at timestamptz;
  end if;
end $migrate$;

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

-- ---------------------------------------------------------------------------
-- 5. Default new clubs to club OAuth; fix rows without a real merchant connection
-- ---------------------------------------------------------------------------

do $migrate$
declare
  has_payment_model boolean;
  has_stripe_connect_status boolean;
  has_gocardless_status boolean;
  has_gocardless_merchant_id boolean;
  has_payment_method_gocardless_dd boolean;
  has_preferred_payment_provider boolean;
  preferred_provider_expr text;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'providers'
      and column_name = 'payment_model'
  ) into has_payment_model;

  if not has_payment_model then
    return;
  end if;

  execute $sql$
    alter table public.providers
      alter column payment_model set default 'club_oauth'
  $sql$;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'providers'
      and column_name = 'stripe_connect_status'
  ) into has_stripe_connect_status;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'providers'
      and column_name = 'gocardless_status'
  ) into has_gocardless_status;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'providers'
      and column_name = 'gocardless_merchant_id'
  ) into has_gocardless_merchant_id;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'providers'
      and column_name = 'payment_method_gocardless_dd'
  ) into has_payment_method_gocardless_dd;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'providers'
      and column_name = 'preferred_payment_provider'
  ) into has_preferred_payment_provider;

  if has_stripe_connect_status then
    preferred_provider_expr := $expr$
      case
        when coalesce(gocardless_merchant_id, '') <> ''
          and gocardless_status = 'connected'
          then 'gocardless'
        when stripe_connect_status in ('connected', 'payouts_enabled')
          then 'stripe'
        else coalesce(nullif(preferred_payment_provider, 'gocardless'), 'stripe')
      end
    $expr$;
  elsif has_preferred_payment_provider then
    preferred_provider_expr := $expr$
      case
        when coalesce(gocardless_merchant_id, '') <> ''
          and gocardless_status = 'connected'
          then 'gocardless'
        else coalesce(nullif(preferred_payment_provider, 'gocardless'), 'stripe')
      end
    $expr$;
  else
    preferred_provider_expr := null;
  end if;

  if has_gocardless_status
    and has_gocardless_merchant_id
    and has_payment_method_gocardless_dd
    and preferred_provider_expr is not null
  then
    execute format(
      $sql$
        update public.providers
        set
          payment_model = 'club_oauth',
          gocardless_status = case
            when coalesce(gocardless_merchant_id, '') <> ''
              and gocardless_status in ('connected', 'pending_setup', 'action_required')
              then gocardless_status
            else 'not_connected'
          end,
          payment_method_gocardless_dd = case
            when coalesce(gocardless_merchant_id, '') <> ''
              and gocardless_status = 'connected'
              then true
            else false
          end,
          preferred_payment_provider = %s
        where payment_model = 'platform_managed'
          and coalesce(gocardless_merchant_id, '') = ''
      $sql$,
      preferred_provider_expr
    );
  elsif has_gocardless_status
    and has_gocardless_merchant_id
    and has_payment_method_gocardless_dd
  then
    execute $sql$
      update public.providers
      set
        payment_model = 'club_oauth',
        gocardless_status = case
          when coalesce(gocardless_merchant_id, '') <> ''
            and gocardless_status in ('connected', 'pending_setup', 'action_required')
            then gocardless_status
          else 'not_connected'
        end,
        payment_method_gocardless_dd = case
          when coalesce(gocardless_merchant_id, '') <> ''
            and gocardless_status = 'connected'
            then true
          else false
        end
      where payment_model = 'platform_managed'
        and coalesce(gocardless_merchant_id, '') = ''
    $sql$;
  else
    execute $sql$
      update public.providers
      set payment_model = 'club_oauth'
      where payment_model = 'platform_managed'
    $sql$;
  end if;
end $migrate$;
