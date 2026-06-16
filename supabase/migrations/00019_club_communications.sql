-- Club communications (Activora)

create table if not exists public.club_message_templates (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null,
  code text not null check (code in ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H')),
  name text not null,
  description text not null default '',
  channel text not null default 'email' check (channel in ('email', 'sms', 'whatsapp')),
  subject text not null default '',
  body text not null default '',
  enabled boolean not null default true,
  send_timing text not null default 'immediate',
  updated_at timestamptz not null default now(),
  unique (provider_id, code)
);

create table if not exists public.club_message_log (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null,
  template_code text not null,
  channel text not null default 'email',
  status text not null check (status in ('sent', 'scheduled', 'failed')),
  parent_email text,
  booking_id uuid references public.bookings(id) on delete set null,
  sent_at timestamptz not null default now()
);

create table if not exists public.club_parent_replies (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null,
  parent_name text not null,
  child_name text not null,
  activity text not null,
  last_message text not null,
  last_message_at timestamptz not null default now(),
  status text not null default 'open' check (status in ('open', 'resolved', 'pending')),
  assigned_staff text not null default 'Unassigned',
  booking_id uuid references public.bookings(id) on delete set null,
  customer_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_club_message_log_provider_sent
  on public.club_message_log (provider_id, sent_at desc);

create index if not exists idx_club_parent_replies_provider_status
  on public.club_parent_replies (provider_id, status);
