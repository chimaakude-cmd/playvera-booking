-- Club share tracking — future analytics tables (stubs)
-- App currently uses localStorage: activora-club-share-events, activora-club-share-metrics

create table if not exists public.share_events (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  event_type text not null check (event_type in ('qr_scan', 'link_click', 'social_share')),
  platform text,
  visitor_session_id text,
  referrer text,
  created_at timestamptz not null default now()
);

comment on table public.share_events is
  'Individual share and discovery events for club profiles (future sync from client).';

create index if not exists share_events_provider_created_idx
  on public.share_events (provider_id, created_at desc);

create table if not exists public.share_metrics (
  provider_id uuid primary key references public.providers (id) on delete cascade,
  profile_visits integer not null default 0,
  qr_scans integer not null default 0,
  link_clicks integer not null default 0,
  bookings_from_shares integer not null default 0,
  top_platform text,
  updated_at timestamptz not null default now()
);

comment on table public.share_metrics is
  'Aggregated share metrics per provider (future rollup from share_events).';

alter table public.share_events enable row level security;
alter table public.share_metrics enable row level security;

create policy "share_events_provider_read"
  on public.share_events for select
  using (true);

create policy "share_metrics_provider_read"
  on public.share_metrics for select
  using (true);
