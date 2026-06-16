-- =============================================================================
-- Activora database schema
-- =============================================================================
-- Fresh install SQL for Supabase.
-- Does NOT migrate localStorage. Does NOT configure auth or Stripe.
--
-- If you already ran an older version of this migration, drop existing Activora
-- tables/enums first or create a new Supabase project before running again.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.session_booking_type as enum (
  'individual',
  'block',
  'subscription'
);

create type public.ticket_type as enum (
  'free',
  'per_session',
  'block_price',
  'free_trial',
  'subscription_placeholder'
);

create type public.booking_status as enum (
  'pending',
  'confirmed',
  'cancelled',
  'refund_requested'
);

create type public.refund_request_status as enum (
  'pending',
  'approved',
  'rejected',
  'cancelled'
);

create type public.fee_handling as enum (
  'provider_absorbs',
  'fees_on_top'
);

-- ---------------------------------------------------------------------------
-- providers
-- ---------------------------------------------------------------------------

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  email text,
  phone text,
  location text,
  platform_fee_percent numeric(5, 2) not null default 2,
  fee_handling public.fee_handling not null default 'provider_absorbs',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.providers is
  'Activity clubs / providers on Activora. One provider owns many sessions.';

-- ---------------------------------------------------------------------------
-- parent_profiles
-- ---------------------------------------------------------------------------

create table public.parent_profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null default '',
  email text not null default '',
  phone text not null default '',
  emergency_contact text not null default '',
  relationship_to_child text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.parent_profiles is
  'Parent contact profile. Auth link added later when authentication ships.';

-- ---------------------------------------------------------------------------
-- children
-- ---------------------------------------------------------------------------

create table public.children (
  id uuid primary key default gen_random_uuid(),
  parent_profile_id uuid not null references public.parent_profiles (id) on delete cascade,
  full_name text not null,
  date_of_birth date not null,
  medical_conditions text not null default '',
  sen_needs text not null default '',
  allergies text not null default '',
  emergency_contact_name text not null default '',
  emergency_contact_phone text not null default '',
  medical_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.children is
  'Child profiles belonging to a parent profile.';

create index children_parent_profile_id_idx on public.children (parent_profile_id);

-- ---------------------------------------------------------------------------
-- sessions
-- ---------------------------------------------------------------------------

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  session_title text not null,
  description text not null default '',
  activity_type text not null default 'camps',
  location text not null default '',
  age_range text not null default '',
  booking_type public.session_booking_type not null default 'individual',
  attendee_criteria jsonb not null default '{}'::jsonb,
  schedule_config jsonb not null default '{}'::jsonb,
  images jsonb not null default '{}'::jsonb,
  parents_bring text not null default '',
  club_provides text not null default '',
  confirmation_email jsonb not null default '{}'::jsonb,
  default_capacity integer not null default 20 check (default_capacity >= 1),
  day text not null default 'monday',
  start_time time not null default '15:30',
  end_time time not null default '16:30',
  price numeric(10, 2) not null default 0,
  capacity integer not null default 20,
  platform_fee_percent numeric(5, 2) not null default 2,
  bookings_count integer not null default 0 check (bookings_count >= 0),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sessions is
  'Club session created via the Activora wizard.';
comment on column public.sessions.booking_type is
  'individual | block | subscription — how parents book this session.';
comment on column public.sessions.schedule_config is
  'Planner metadata: repeat settings, off_days, exception_dates.';
comment on column public.sessions.images is
  'Image references; file blobs stored in Supabase Storage later.';

create index sessions_provider_id_idx on public.sessions (provider_id);
create index sessions_booking_type_idx on public.sessions (booking_type);
create index sessions_published_idx on public.sessions (published) where published = true;

-- ---------------------------------------------------------------------------
-- session_dates
-- ---------------------------------------------------------------------------

create table public.session_dates (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  capacity integer not null check (capacity >= 1),
  cancelled boolean not null default false,
  bookings_count integer not null default 0 check (bookings_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, session_date, start_time)
);

comment on table public.session_dates is
  'One scheduled occurrence for a session (date, time, capacity).';

create index session_dates_session_id_idx on public.session_dates (session_id);
create index session_dates_session_date_idx on public.session_dates (session_date);

-- ---------------------------------------------------------------------------
-- tickets
-- ---------------------------------------------------------------------------

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  name text not null,
  description text not null default '',
  ticket_type public.ticket_type not null default 'per_session',
  price numeric(10, 2) not null default 0 check (price >= 0),
  low_spaces_trigger boolean not null default true,
  recent_booking_flag boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tickets is
  'Ticket/pricing options offered for a session.';

create index tickets_session_id_idx on public.tickets (session_id);
create index tickets_ticket_type_idx on public.tickets (ticket_type);

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete restrict,
  session_date_id uuid references public.session_dates (id) on delete set null,
  ticket_id uuid references public.tickets (id) on delete set null,
  parent_profile_id uuid references public.parent_profiles (id) on delete set null,
  session_title text not null,
  provider_name text not null default '',
  day text not null default '',
  start_time time,
  end_time time,
  price_paid numeric(10, 2) not null default 0 check (price_paid >= 0),
  parent_name text not null,
  email text not null,
  emergency_contact text not null default '',
  status public.booking_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.bookings is
  'Parent booking for a session. Children linked via booking_children.';
comment on column public.bookings.status is
  'pending | confirmed | cancelled | refund_requested';

create index bookings_session_id_idx on public.bookings (session_id);
create index bookings_parent_profile_id_idx on public.bookings (parent_profile_id);
create index bookings_status_idx on public.bookings (status);
create index bookings_created_at_idx on public.bookings (created_at desc);

-- ---------------------------------------------------------------------------
-- booking_children
-- ---------------------------------------------------------------------------

create table public.booking_children (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  child_id uuid references public.children (id) on delete set null,
  child_name text not null,
  child_age integer check (child_age >= 0 and child_age <= 18),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id, child_id)
);

comment on table public.booking_children is
  'Children attached to a booking. child_id nullable for guest checkout snapshots.';

create index booking_children_booking_id_idx on public.booking_children (booking_id);
create index booking_children_child_id_idx on public.booking_children (child_id);

-- ---------------------------------------------------------------------------
-- refund_requests
-- ---------------------------------------------------------------------------

create table public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  requested_by_parent_profile_id uuid references public.parent_profiles (id) on delete set null,
  reason text not null default '',
  provider_notes text not null default '',
  status public.refund_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.refund_requests is
  'Refund workflow for a booking. Stripe integration added later.';

create index refund_requests_booking_id_idx on public.refund_requests (booking_id);
create index refund_requests_status_idx on public.refund_requests (status);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger providers_set_updated_at
  before update on public.providers
  for each row execute function public.set_updated_at();

create trigger parent_profiles_set_updated_at
  before update on public.parent_profiles
  for each row execute function public.set_updated_at();

create trigger children_set_updated_at
  before update on public.children
  for each row execute function public.set_updated_at();

create trigger sessions_set_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

create trigger session_dates_set_updated_at
  before update on public.session_dates
  for each row execute function public.set_updated_at();

create trigger tickets_set_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

create trigger booking_children_set_updated_at
  before update on public.booking_children
  for each row execute function public.set_updated_at();

create trigger refund_requests_set_updated_at
  before update on public.refund_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security (enabled; policies added with authentication)
-- ---------------------------------------------------------------------------

alter table public.providers enable row level security;
alter table public.parent_profiles enable row level security;
alter table public.children enable row level security;
alter table public.sessions enable row level security;
alter table public.session_dates enable row level security;
alter table public.tickets enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_children enable row level security;
alter table public.refund_requests enable row level security;
