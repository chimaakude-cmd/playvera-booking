-- Platform admin removal for activity listings (sessions)

create type public.session_moderation_status as enum (
  'active',
  'removed'
);

alter table public.sessions
  add column if not exists moderation_status public.session_moderation_status not null default 'active',
  add column if not exists removal_reason text,
  add column if not exists removal_notes text,
  add column if not exists removed_at timestamptz,
  add column if not exists removed_by text;

create index if not exists sessions_moderation_status_idx
  on public.sessions (moderation_status);

comment on column public.sessions.moderation_status is
  'Platform moderation state. removed listings are hidden from admin marketplace views.';
comment on column public.sessions.removal_reason is
  'Moderation reason when an admin removes a listing.';
comment on column public.sessions.removal_notes is
  'Optional admin notes when a listing is removed.';
comment on column public.sessions.removed_at is
  'Timestamp when a platform admin removed this listing.';
comment on column public.sessions.removed_by is
  'Platform admin user id that removed this listing.';
