-- Activora chat / helpdesk system

create type public.conversation_type as enum (
  'public',
  'parent',
  'provider'
);

create type public.conversation_status as enum (
  'open',
  'pending',
  'resolved',
  'closed'
);

create type public.conversation_priority as enum (
  'low',
  'normal',
  'high',
  'urgent'
);

create type public.message_sender_type as enum (
  'visitor',
  'parent',
  'provider',
  'admin',
  'system'
);

create type public.handled_by as enum (
  'human',
  'ai',
  'hybrid'
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  type public.conversation_type not null,
  status public.conversation_status not null default 'open',
  priority public.conversation_priority not null default 'normal',
  handled_by public.handled_by not null default 'human',
  ai_assistant_enabled boolean not null default false,
  contact_name text not null default '',
  contact_email text not null default '',
  user_type text not null default 'visitor',
  provider_id uuid references public.providers (id) on delete set null,
  booking_id uuid references public.bookings (id) on delete set null,
  assigned_admin_id uuid,
  subject text not null default '',
  last_message_preview text not null default '',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.conversations is
  'Helpdesk conversations — public enquiries, parent support, and provider support.';

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_type public.message_sender_type not null,
  sender_name text not null default '',
  body text not null,
  created_at timestamptz not null default now()
);

create index messages_conversation_id_idx on public.messages (conversation_id);

create table public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  participant_type text not null,
  participant_id uuid,
  participant_email text,
  participant_name text not null default '',
  joined_at timestamptz not null default now()
);

create index conversation_participants_conversation_id_idx
  on public.conversation_participants (conversation_id);

create table public.internal_notes (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  author_admin_id uuid,
  author_name text not null default '',
  body text not null,
  created_at timestamptz not null default now()
);

create index internal_notes_conversation_id_idx
  on public.internal_notes (conversation_id);

create table public.conversation_assignments (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  admin_id uuid not null,
  admin_name text not null default '',
  assigned_at timestamptz not null default now()
);

create index conversation_assignments_conversation_id_idx
  on public.conversation_assignments (conversation_id);
