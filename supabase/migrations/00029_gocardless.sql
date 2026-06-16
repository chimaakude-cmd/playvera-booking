-- GoCardless backup payment provider (Stripe remains primary)

alter table public.providers
  add column if not exists gocardless_status text not null default 'not_connected',
  add column if not exists gocardless_organisation_id text,
  add column if not exists gocardless_merchant_id text,
  add column if not exists gocardless_connected_at timestamptz,
  add column if not exists preferred_payment_provider text not null default 'stripe',
  add column if not exists payment_method_stripe_card boolean not null default true,
  add column if not exists payment_method_gocardless_dd boolean not null default false,
  add column if not exists payment_method_manual_invoice boolean not null default false;

create table if not exists public.gocardless_connections (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  organisation_id text,
  access_token_encrypted text,
  merchant_id text,
  status text not null default 'not_connected',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id)
);

create table if not exists public.gocardless_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null,
  provider_id uuid not null references public.providers(id) on delete cascade,
  amount numeric(12, 2) not null,
  activora_fee numeric(12, 2) not null default 0,
  gocardless_fee numeric(12, 2) not null default 0,
  provider_net numeric(12, 2) not null default 0,
  status text not null default 'payment_pending',
  mandate_id text,
  payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gocardless_payments_booking_id_idx
  on public.gocardless_payments (booking_id);

create index if not exists gocardless_payments_provider_id_idx
  on public.gocardless_payments (provider_id);
