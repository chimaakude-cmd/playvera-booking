-- Monthly subscription billing for parent session bookings (Stripe V1)

-- Extend ticket_type enum for live subscriptions (keep subscription_placeholder for legacy rows)
do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'ticket_type'
      and e.enumlabel = 'subscription'
  ) then
    alter type public.ticket_type add value 'subscription';
  end if;
end $$;

-- Session-level subscription configuration
alter table public.sessions
  add column if not exists payment_type text;

alter table public.sessions
  add column if not exists stripe_product_id text;

alter table public.sessions
  add column if not exists stripe_price_id text;

alter table public.sessions
  add column if not exists subscription_enabled boolean not null default false;

alter table public.sessions
  add column if not exists billing_interval text;

alter table public.sessions
  add column if not exists billing_start_date date;

alter table public.sessions
  add column if not exists billing_day integer;

alter table public.sessions
  add column if not exists trial_days integer;

alter table public.sessions
  add column if not exists cancel_anytime boolean not null default true;

alter table public.sessions
  add column if not exists minimum_commitment_months integer;

comment on column public.sessions.payment_type is
  'one_off | monthly_subscription | free — how parents pay for this activity.';
comment on column public.sessions.subscription_enabled is
  'True when parents can subscribe via recurring Stripe billing.';
comment on column public.sessions.billing_interval is
  'monthly | weekly | termly — recurring billing cadence.';

-- Per-ticket subscription billing overrides (optional)
alter table public.tickets
  add column if not exists subscription_billing jsonb not null default '{}'::jsonb;

comment on column public.tickets.subscription_billing is
  'Ticket-level subscription settings: billingStartDate, billingDay, trialDays, cancelAnytime, minimumCommitmentMonths.';

-- Parent subscription records (Stripe Connect recurring)
create table if not exists public.parent_subscription_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  ticket_id uuid references public.tickets (id) on delete set null,
  booking_id uuid references public.bookings (id) on delete set null,
  provider_id uuid not null references public.providers (id) on delete cascade,
  parent_email text not null,
  parent_name text not null default '',
  child_name text not null default '',
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_checkout_session_id text,
  status text not null default 'pending'
    check (
      status in (
        'pending',
        'active',
        'trialing',
        'past_due',
        'canceled',
        'incomplete',
        'unpaid'
      )
    ),
  monthly_amount numeric(10, 2) not null default 0 check (monthly_amount >= 0),
  platform_fee_percent numeric(5, 2) not null default 2.5,
  current_period_end timestamptz,
  canceled_at timestamptz,
  last_payment_failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists parent_subscription_records_stripe_subscription_id_idx
  on public.parent_subscription_records (stripe_subscription_id)
  where stripe_subscription_id is not null;

create index if not exists parent_subscription_records_session_id_idx
  on public.parent_subscription_records (session_id);

create index if not exists parent_subscription_records_provider_id_idx
  on public.parent_subscription_records (provider_id);

create index if not exists parent_subscription_records_status_idx
  on public.parent_subscription_records (status);

comment on table public.parent_subscription_records is
  'Parent recurring subscriptions for session activities (Stripe Checkout subscription mode).';

create trigger parent_subscription_records_set_updated_at
  before update on public.parent_subscription_records
  for each row execute function public.set_updated_at();

alter table public.parent_subscription_records enable row level security;
