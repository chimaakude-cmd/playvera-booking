-- Club finance tables (future Stripe Connect + accounting sync)

create type public.payment_status as enum (
  'paid',
  'pending',
  'failed',
  'refunded',
  'partially_refunded'
);

create type public.payout_status as enum (
  'paid_out',
  'pending',
  'in_transit',
  'held'
);

create type public.refund_status as enum (
  'completed',
  'pending',
  'failed'
);

create type public.accounting_integration as enum (
  'freeagent',
  'quickbooks',
  'xero'
);

-- Extend fee_handling with split_fee (UI already supports it)
alter type public.fee_handling add value if not exists 'split_fee';

create table public.club_finance_transactions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete set null,
  parent_name text not null,
  parent_email text not null,
  child_name text,
  activity_name text not null,
  venue text,
  gross_amount numeric(10, 2) not null,
  stripe_fee numeric(10, 2) not null default 0,
  platform_fee numeric(10, 2) not null default 0,
  net_amount numeric(10, 2) not null,
  payment_status public.payment_status not null default 'pending',
  payout_status public.payout_status not null default 'pending',
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.club_finance_payouts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  amount numeric(10, 2) not null,
  status public.payout_status not null default 'pending',
  reference text not null,
  stripe_payout_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.club_finance_payout_transactions (
  payout_id uuid not null references public.club_finance_payouts (id) on delete cascade,
  transaction_id uuid not null references public.club_finance_transactions (id) on delete cascade,
  primary key (payout_id, transaction_id)
);

create table public.club_finance_refunds (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  transaction_id uuid references public.club_finance_transactions (id) on delete set null,
  booking_id uuid references public.bookings (id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  booking_reference text,
  activity_name text,
  refund_amount numeric(10, 2) not null,
  reason text,
  status public.refund_status not null default 'pending',
  stripe_refund_id text,
  refunded_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.club_accounting_integrations (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  provider public.accounting_integration not null,
  status text not null default 'not_connected',
  connected_at timestamptz,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  unique (club_id, provider)
);

create index club_finance_transactions_club_id_idx
  on public.club_finance_transactions (club_id);

create index club_finance_payouts_club_id_idx
  on public.club_finance_payouts (club_id);

create index club_finance_refunds_club_id_idx
  on public.club_finance_refunds (club_id);
