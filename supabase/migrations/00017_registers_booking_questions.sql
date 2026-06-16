-- Registers and booking questions (Activora club dashboard)

create table if not exists public.session_booking_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  key text not null,
  label text not null,
  answer_type text not null check (
    answer_type in ('short_text', 'long_text', 'yes_no', 'multiple_choice', 'checkbox')
  ),
  required boolean not null default false,
  show_on_register boolean not null default true,
  enabled boolean not null default true,
  is_custom boolean not null default false,
  choices jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.booking_question_answers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  question_id uuid references public.session_booking_questions(id) on delete set null,
  question_key text not null,
  label text not null,
  value_text text,
  value_bool boolean,
  show_on_register boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.register_attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  session_date date not null,
  start_time time not null,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  attendance_status text not null default 'not_marked' check (
    attendance_status in ('present', 'late', 'absent', 'not_marked')
  ),
  notes text,
  marked_by uuid,
  updated_at timestamptz not null default now(),
  unique (session_id, session_date, start_time, booking_id)
);

create index if not exists idx_register_attendance_session
  on public.register_attendance (session_id, session_date, start_time);

create index if not exists idx_booking_question_answers_booking
  on public.booking_question_answers (booking_id);
