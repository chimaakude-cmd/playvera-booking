-- =============================================================================
-- Activora session venue / location columns
-- =============================================================================
-- Run in Supabase SQL Editor after 00001_activora_schema.sql
-- =============================================================================

alter table public.sessions
  add column if not exists venue_name text not null default '',
  add column if not exists address_line_1 text not null default '',
  add column if not exists address_line_2 text not null default '',
  add column if not exists town_city text not null default '',
  add column if not exists postcode text not null default '',
  add column if not exists location_notes text not null default '',
  add column if not exists latitude numeric(10, 7),
  add column if not exists longitude numeric(10, 7);

comment on column public.sessions.venue_name is 'Display name of the venue, e.g. community centre or sports hall.';
comment on column public.sessions.address_line_1 is 'Primary street address for the session venue.';
comment on column public.sessions.address_line_2 is 'Optional second address line, e.g. unit or building name.';
comment on column public.sessions.town_city is 'Town or city for the session venue.';
comment on column public.sessions.postcode is 'Postcode for the session venue.';
comment on column public.sessions.location_notes is 'Optional arrival or pickup notes for parents.';
comment on column public.sessions.latitude is 'Optional venue latitude. Placeholder coords used when null.';
comment on column public.sessions.longitude is 'Optional venue longitude. Placeholder coords used when null.';

comment on column public.sessions.location is
  'Legacy display location string. Prefer venue_name, town_city, and postcode.';

create index if not exists sessions_postcode_idx on public.sessions (postcode);
create index if not exists sessions_town_city_idx on public.sessions (town_city);
