-- Club discounts (Activora)

create table if not exists public.club_discounts (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null,
  name text not null,
  code text not null,
  type text not null check (type in ('percentage', 'fixed')),
  value numeric(10, 2) not null check (value > 0),
  applies_to text not null,
  applies_to_label text,
  minimum_spend numeric(10, 2) not null default 0 check (minimum_spend >= 0),
  usage_limit_total integer,
  usage_limit_per_parent integer,
  start_date date not null,
  end_date date,
  is_active boolean not null default true,
  is_paused boolean not null default false,
  is_archived boolean not null default false,
  redemption_count integer not null default 0,
  total_discounted_amount numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id, code)
);

create table if not exists public.club_discount_redemptions (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null,
  discount_id uuid not null references public.club_discounts(id) on delete cascade,
  discount_code text not null,
  parent_name text not null,
  parent_email text not null,
  booking_id uuid references public.bookings(id) on delete set null,
  booking_reference text not null,
  activity_name text not null,
  original_amount numeric(10, 2) not null,
  discount_amount numeric(10, 2) not null check (discount_amount >= 0),
  final_amount numeric(10, 2) not null check (final_amount >= 0),
  redeemed_at timestamptz not null default now()
);

create index if not exists idx_club_discounts_provider_active
  on public.club_discounts (provider_id, is_active, is_archived);

create index if not exists idx_club_discount_redemptions_provider
  on public.club_discount_redemptions (provider_id, redeemed_at desc);

create index if not exists idx_club_discount_redemptions_discount
  on public.club_discount_redemptions (discount_id);
