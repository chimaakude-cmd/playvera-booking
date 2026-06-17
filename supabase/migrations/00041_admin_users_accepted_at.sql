-- Record when an invited admin activated their account.

alter table public.admin_users
  add column if not exists accepted_at timestamptz;

comment on column public.admin_users.accepted_at is
  'When the admin accepted their invite and activated their account.';
