-- Activora provider platform subscriptions (Pro / Franchise via GoCardless)

create table if not exists public.provider_subscriptions (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  plan text not null default 'STARTER',
  gocardless_customer_id text,
  mandate_id text,
  subscription_id text,
  status text not null default 'none',
  next_billing_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id)
);

create index if not exists provider_subscriptions_subscription_id_idx
  on public.provider_subscriptions (subscription_id)
  where subscription_id is not null;

create index if not exists provider_subscriptions_mandate_id_idx
  on public.provider_subscriptions (mandate_id)
  where mandate_id is not null;
