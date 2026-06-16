-- Reviews v2 — future fields and status extensions
-- Builds on 00016_reviews.sql

-- Extend review status with 'reported' (maps from legacy 'flagged')
alter type public.review_status add value if not exists 'reported';

comment on column public.reviews.title is
  'Auto-generated from rating; editable by admin. Not shown prominently on public cards.';

-- Future moderation and analytics fields (stubs — not yet wired in app)
alter table public.reviews
  add column if not exists helpful_count integer not null default 0,
  add column if not exists reviewer_first_name text not null default 'Verified Parent',
  add column if not exists session_title text not null default '',
  add column if not exists provider_display_name text not null default '',
  add column if not exists date_attended date,
  add column if not exists anonymous boolean not null default false,
  add column if not exists reported_at timestamptz,
  add column if not exists ai_scam_flag boolean not null default false,
  add column if not exists duplicate_hash text,
  add column if not exists sentiment_score numeric(4, 2),
  add column if not exists verified_repeat_customer boolean not null default false;

comment on column public.reviews.reported_at is
  'Timestamp when review was reported by club or parent.';
comment on column public.reviews.ai_scam_flag is
  'AI-detected potential scam or spam review (future).';
comment on column public.reviews.duplicate_hash is
  'Hash of comment text for duplicate detection across providers.';
comment on column public.reviews.sentiment_score is
  'AI sentiment score -1.0 to 1.0 (future).';
comment on column public.reviews.verified_repeat_customer is
  'True when reviewer has 2+ verified bookings with this provider.';

-- Club review settings (future table stub)
create table if not exists public.club_review_settings (
  provider_id uuid primary key references public.providers (id) on delete cascade,
  encourage_reviews boolean not null default true,
  incentive_type text not null default 'thank_you_email'
    check (incentive_type in ('thank_you_email', 'priority_booking', 'club_points', 'discount', 'none')),
  auto_request_enabled boolean not null default true,
  request_delay text not null default 'next_day'
    check (request_delay in ('same_day', 'next_day', 'end_of_block')),
  reminder_days smallint check (reminder_days is null or reminder_days in (3, 7)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.club_review_settings is
  'Per-club review encouragement and automated request configuration.';

-- Review request queue (future)
create table if not exists public.review_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  parent_email text not null default '',
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'sent', 'cancelled')),
  reminder_scheduled_for timestamptz,
  review_link text not null default '',
  created_at timestamptz not null default now()
);

comment on table public.review_requests is
  'Scheduled review request emails sent after attendance is marked.';

create index if not exists review_requests_booking_id_idx on public.review_requests (booking_id);
create index if not exists review_requests_scheduled_for_idx on public.review_requests (scheduled_for);

alter table public.club_review_settings enable row level security;
alter table public.review_requests enable row level security;
