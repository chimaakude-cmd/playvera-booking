-- Club profiles: customer-facing source of truth per provider

create table if not exists public.club_profiles (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null unique references public.providers (id) on delete cascade,

  logo_url text,
  cover_image_url text,
  club_name text not null default '',
  tagline text not null default '',
  short_description text not null default '',
  established_year integer,
  verified boolean not null default false,

  long_description text not null default '',
  unique_selling_points text not null default '',
  categories jsonb not null default '[]'::jsonb,
  age_ranges jsonb not null default '[]'::jsonb,
  accessibility_options jsonb not null default '[]'::jsonb,

  website text not null default '',
  instagram text not null default '',
  facebook text not null default '',
  tiktok text not null default '',
  whatsapp text not null default '',
  email text not null default '',
  phone text not null default '',

  branding jsonb not null default '{}'::jsonb,
  customer_view jsonb not null default '{}'::jsonb,
  media_gallery jsonb not null default '[]'::jsonb,

  public_slug text unique,
  meta_title text not null default '',
  meta_description text not null default '',
  published boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists club_profiles_provider_id_idx
  on public.club_profiles (provider_id);

create index if not exists club_profiles_public_slug_idx
  on public.club_profiles (public_slug)
  where public_slug is not null;

create trigger club_profiles_set_updated_at
  before update on public.club_profiles
  for each row execute function public.set_updated_at();

comment on table public.club_profiles is
  'Customer-facing club profile. Source of truth for public club pages.';

-- Multiple venue locations per club profile

create table if not exists public.club_profile_locations (
  id uuid primary key default gen_random_uuid(),
  club_profile_id uuid not null references public.club_profiles (id) on delete cascade,
  venue_name text not null default '',
  address_line_1 text not null default '',
  address_line_2 text not null default '',
  town_city text not null default '',
  postcode text not null default '',
  latitude numeric not null default 0,
  longitude numeric not null default 0,
  radius_miles numeric(6, 2) not null default 5,
  is_main boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists club_profile_locations_profile_id_idx
  on public.club_profile_locations (club_profile_id);

create trigger club_profile_locations_set_updated_at
  before update on public.club_profile_locations
  for each row execute function public.set_updated_at();

comment on table public.club_profile_locations is
  'Venue locations shown on the public club profile and grouped activity listings.';
