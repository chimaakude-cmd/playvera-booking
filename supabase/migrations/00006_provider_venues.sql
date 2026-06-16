-- Saved provider venues for reuse across sessions

create table if not exists public.provider_venues (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  venue_name text not null default '',
  address_line_1 text not null default '',
  address_line_2 text not null default '',
  town_city text not null default '',
  postcode text not null default '',
  location_notes text not null default '',
  latitude numeric not null,
  longitude numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists provider_venues_provider_id_idx
  on public.provider_venues (provider_id);

create index if not exists provider_venues_postcode_idx
  on public.provider_venues (postcode);

create trigger provider_venues_set_updated_at
  before update on public.provider_venues
  for each row execute function public.set_updated_at();

alter table public.sessions
  add column if not exists provider_venue_id uuid
  references public.provider_venues (id) on delete set null;

create index if not exists sessions_provider_venue_id_idx
  on public.sessions (provider_venue_id);

comment on table public.provider_venues is
  'Reusable venue addresses saved by a provider for session creation.';

comment on column public.sessions.provider_venue_id is
  'Optional link to the saved provider venue used when creating this session. Session address columns remain a snapshot.';
