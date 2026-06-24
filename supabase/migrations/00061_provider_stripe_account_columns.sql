-- Provider Stripe account columns: ensure stripe_account_id and remaining Connect fields exist.
-- Idempotent; safe on prod where 00014 or 00058 may not have fully applied.
-- Follows the defensive information_schema pattern from 00058.

-- ---------------------------------------------------------------------------
-- 1. Stripe Connect account id (nullable — set when Express account is created)
-- ---------------------------------------------------------------------------

do $migrate$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'providers'
      and column_name = 'stripe_account_id'
  ) then
    alter table public.providers
      add column stripe_account_id text;
  end if;
end $migrate$;

comment on column public.providers.stripe_account_id is
  'Stripe Connect Express account id (acct_...) for this club.';

-- ---------------------------------------------------------------------------
-- 2. Stripe Connect status columns (from 00014 / 00058, if missing)
-- ---------------------------------------------------------------------------

alter table public.providers
  add column if not exists stripe_connect_status text not null default 'not_connected',
  add column if not exists stripe_charges_enabled boolean not null default false,
  add column if not exists stripe_payouts_enabled boolean not null default false,
  add column if not exists stripe_details_submitted boolean not null default false,
  add column if not exists stripe_disabled_reason text,
  add column if not exists stripe_requirements_due jsonb not null default '[]'::jsonb,
  add column if not exists stripe_connected_at timestamptz,
  add column if not exists stripe_onboarding_complete boolean not null default false;

comment on column public.providers.stripe_onboarding_complete is
  'True when Stripe Express onboarding has been completed for this club.';

-- ---------------------------------------------------------------------------
-- 3. Backfill stripe_connect_status from legacy flags when status column exists
--    but rows still show not_connected while charges/payouts are enabled.
-- ---------------------------------------------------------------------------

do $migrate$
declare
  has_stripe_connect_status boolean;
  has_stripe_charges_enabled boolean;
  has_stripe_payouts_enabled boolean;
begin
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
      and column_name = 'stripe_charges_enabled'
  ) into has_stripe_charges_enabled;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'providers'
      and column_name = 'stripe_payouts_enabled'
  ) into has_stripe_payouts_enabled;

  if not has_stripe_connect_status then
    return;
  end if;

  if has_stripe_payouts_enabled then
    execute $sql$
      update public.providers
      set stripe_connect_status = 'payouts_enabled'
      where stripe_connect_status = 'not_connected'
        and stripe_payouts_enabled = true
        and stripe_charges_enabled = true
    $sql$;
  end if;

  if has_stripe_charges_enabled then
    execute $sql$
      update public.providers
      set stripe_connect_status = 'connected'
      where stripe_connect_status = 'not_connected'
        and stripe_charges_enabled = true
        and coalesce(stripe_payouts_enabled, false) = false
    $sql$;
  end if;
end $migrate$;
