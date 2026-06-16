-- Activora bug reporting (localStorage-first; future Supabase sync)

create type public.bug_report_account_type as enum (
  'parent',
  'club',
  'franchisor',
  'visitor',
  'other'
);

create type public.bug_report_priority as enum (
  'low',
  'normal',
  'high',
  'urgent'
);

create type public.bug_report_status as enum (
  'new',
  'investigating',
  'in_progress',
  'fixed',
  'cannot_reproduce',
  'closed'
);

create type public.bug_report_note_type as enum ('internal', 'status_change');

create table public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_name text not null,
  reporter_email text not null,
  account_type public.bug_report_account_type not null default 'visitor',
  page_url text not null default '',
  description text not null,
  steps_to_reproduce text not null default '',
  screenshot_url text,
  priority public.bug_report_priority not null default 'normal',
  consent_given boolean not null default false,
  browser text not null default '',
  device text not null default '',
  screen_size text not null default '',
  status public.bug_report_status not null default 'new',
  assigned_admin_id uuid,
  assigned_admin_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.bug_reports is
  'User-submitted bug reports from the public /report-bug form.';

create index bug_reports_status_idx on public.bug_reports (status);
create index bug_reports_priority_idx on public.bug_reports (priority);
create index bug_reports_created_at_idx on public.bug_reports (created_at desc);

create table public.bug_report_notes (
  id uuid primary key default gen_random_uuid(),
  bug_report_id uuid not null references public.bug_reports (id) on delete cascade,
  author_id uuid,
  author_name text not null default '',
  body text not null,
  note_type public.bug_report_note_type not null default 'internal',
  status_from public.bug_report_status,
  status_to public.bug_report_status,
  created_at timestamptz not null default now()
);

comment on table public.bug_report_notes is
  'Internal notes and status-change timeline entries for bug reports.';

create index bug_report_notes_bug_report_id_idx
  on public.bug_report_notes (bug_report_id, created_at);
