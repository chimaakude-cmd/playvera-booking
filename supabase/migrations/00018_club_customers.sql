-- Club customers CRM (Activora)

create table if not exists public.club_customer_notes (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null,
  customer_email text not null,
  notes text not null default '',
  updated_at timestamptz not null default now(),
  unique (provider_id, customer_email)
);

create table if not exists public.customer_refunds (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  provider_id uuid not null,
  amount numeric(12,2) not null,
  refund_type text not null check (refund_type in ('full', 'partial')),
  reason text not null,
  status text not null default 'pending' check (
    status in ('pending', 'completed', 'failed')
  ),
  created_at timestamptz not null default now()
);

create index if not exists idx_customer_refunds_booking
  on public.customer_refunds (booking_id);
