-- Activora verified review system

create type public.review_status as enum (
  'pending',
  'published',
  'hidden',
  'flagged',
  'removed'
);

create type public.ai_moderation_status as enum (
  'not_checked',
  'approved',
  'flagged',
  'rejected'
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  activity_id uuid not null references public.sessions (id) on delete cascade,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  parent_id uuid references public.parent_profiles (id) on delete set null,
  child_id uuid references public.children (id) on delete set null,
  rating smallint not null check (rating >= 1 and rating <= 5),
  title text not null default '',
  body text not null,
  recommend boolean not null default true,
  what_went_well text,
  what_could_improve text,
  status public.review_status not null default 'pending',
  verified_booking boolean not null default false,
  suspicious_flag boolean not null default false,
  ai_moderation_status public.ai_moderation_status not null default 'not_checked',
  duplicate_detected boolean not null default false,
  abusive_language_detected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id)
);

comment on table public.reviews is
  'Verified parent reviews linked to attended bookings. One review per booking.';

create index reviews_provider_id_idx on public.reviews (provider_id);
create index reviews_activity_id_idx on public.reviews (activity_id);
create index reviews_status_idx on public.reviews (status);
create index reviews_created_at_idx on public.reviews (created_at desc);

create table public.review_responses (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  provider_id uuid not null references public.providers (id) on delete cascade,
  body text not null,
  responded_by text not null default '',
  created_at timestamptz not null default now()
);

comment on table public.review_responses is
  'Public provider responses to parent reviews.';

create index review_responses_review_id_idx on public.review_responses (review_id);

create table public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  reported_by text not null default '',
  reason text not null default '',
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

comment on table public.review_reports is
  'Club or admin reports of inappropriate reviews.';

create index review_reports_review_id_idx on public.review_reports (review_id);
create index review_reports_status_idx on public.review_reports (status);

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

alter table public.reviews enable row level security;
alter table public.review_responses enable row level security;
alter table public.review_reports enable row level security;
