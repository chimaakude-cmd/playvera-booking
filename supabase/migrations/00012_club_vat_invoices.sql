-- Club VAT settings and monthly invoices (future)

create table public.club_vat_settings (
  club_id uuid primary key references public.clubs (id) on delete cascade,
  club_account_email text not null,
  is_vat_registered boolean not null default false,
  vat_registration_number text,
  vat_rate_percent numeric(5, 2) not null default 20,
  add_vat_to_bookings boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.club_monthly_invoices (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  period_label text not null,
  period_start date not null,
  period_end date not null,
  total_sales numeric(12, 2) not null,
  total_bookings integer not null,
  gross_revenue numeric(12, 2) not null,
  platform_fees numeric(12, 2) not null,
  stripe_fees numeric(12, 2) not null,
  refunds numeric(12, 2) not null default 0,
  net_paid_out numeric(12, 2) not null,
  vat_net numeric(12, 2) not null default 0,
  vat_amount numeric(12, 2) not null default 0,
  payout_destination text,
  payout_dates timestamptz[] not null default '{}',
  generated_at timestamptz not null default now(),
  unique (club_id, period_start, period_end)
);

create table public.club_monthly_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.club_monthly_invoices (id) on delete cascade,
  booking_reference text not null,
  activity_name text not null,
  venue text,
  gross_amount numeric(10, 2) not null,
  net_amount numeric(10, 2) not null default 0,
  vat_amount numeric(10, 2) not null default 0,
  platform_fee numeric(10, 2) not null default 0,
  stripe_fee numeric(10, 2) not null default 0,
  net_payout numeric(10, 2) not null,
  payment_date timestamptz,
  payout_date timestamptz
);

create table public.club_rolling_revenue_snapshots (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  month date not null,
  revenue numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  unique (club_id, month)
);

create index club_monthly_invoices_club_id_idx
  on public.club_monthly_invoices (club_id);

create index club_monthly_invoice_lines_invoice_id_idx
  on public.club_monthly_invoice_lines (invoice_id);
