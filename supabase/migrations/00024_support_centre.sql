-- Activora Support Centre (replaces legacy chat for new features)
-- Legacy tables from 00015_chat_system.sql remain for migration compatibility.

create type public.support_mode as enum ('ai', 'human', 'hybrid');

create type public.support_context as enum (
  'public',
  'parent',
  'club_onboarding',
  'club_signed_in',
  'admin'
);

create type public.support_message_type as enum (
  'support',
  'payments',
  'bookings',
  'technical',
  'general'
);

create type public.thread_status as enum ('waiting', 'assigned', 'resolved');

create type public.support_sender_type as enum ('user', 'ai', 'human', 'system');

create table public.support_threads (
  id uuid primary key default gen_random_uuid(),
  context public.support_context not null,
  support_mode public.support_mode not null default 'hybrid',
  message_type public.support_message_type not null default 'general',
  status public.thread_status not null default 'waiting',
  subject text not null default '',
  icon text,
  contact_name text not null default '',
  contact_email text not null default '',
  user_id uuid,
  last_message_preview text not null default '',
  last_message_at timestamptz not null default now(),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.support_threads is
  'Support Centre threads — unified AI + human support across all contexts.';

create index support_threads_context_idx on public.support_threads (context);
create index support_threads_status_idx on public.support_threads (status);
create index support_threads_last_message_at_idx
  on public.support_threads (last_message_at desc);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads (id) on delete cascade,
  sender_type public.support_sender_type not null,
  sender_name text not null default '',
  body text not null,
  message_type public.support_message_type not null default 'general',
  needs_escalation boolean not null default false,
  created_at timestamptz not null default now()
);

create index support_messages_thread_id_idx on public.support_messages (thread_id);

create table public.support_assignments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.support_threads (id) on delete cascade,
  assignee_id text not null,
  assignee_name text not null default '',
  assigned_at timestamptz not null default now()
);

create index support_assignments_thread_id_idx
  on public.support_assignments (thread_id);
