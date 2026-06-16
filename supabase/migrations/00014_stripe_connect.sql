-- Stripe Connect status fields on providers

alter table public.providers
  add column if not exists stripe_connect_status text not null default 'not_connected',
  add column if not exists stripe_charges_enabled boolean not null default false,
  add column if not exists stripe_payouts_enabled boolean not null default false,
  add column if not exists stripe_details_submitted boolean not null default false,
  add column if not exists stripe_disabled_reason text,
  add column if not exists stripe_requirements_due jsonb not null default '[]'::jsonb,
  add column if not exists stripe_connected_at timestamptz;
