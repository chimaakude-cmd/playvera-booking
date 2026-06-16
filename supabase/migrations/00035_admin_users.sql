-- Platform admin users and invites (stub — wire to auth when production auth ships)

create type public.platform_admin_role as enum (
  'owner',
  'super_admin',
  'support_admin',
  'finance_admin',
  'content_admin'
);

create type public.platform_admin_status as enum (
  'invited',
  'active',
  'disabled'
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  name text not null default '',
  email text not null unique,
  role public.platform_admin_role not null default 'support_admin',
  status public.platform_admin_status not null default 'invited',
  email_verified boolean not null default false,
  password_hash text,
  invite_token text unique,
  invite_sent_at timestamptz,
  last_login_at timestamptz,
  is_owner boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_users_email_idx on public.admin_users (email);
create index if not exists admin_users_status_idx on public.admin_users (status);
create index if not exists admin_users_invite_token_idx
  on public.admin_users (invite_token)
  where invite_token is not null;

create trigger admin_users_set_updated_at
  before update on public.admin_users
  for each row execute function public.set_updated_at();

create table if not exists public.admin_user_audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  target_user_id uuid references public.admin_users (id) on delete set null,
  target_email text not null,
  actor_id text not null,
  actor_name text not null,
  actor_email text not null,
  details text,
  created_at timestamptz not null default now()
);

create index if not exists admin_user_audit_log_target_user_id_idx
  on public.admin_user_audit_log (target_user_id);

comment on table public.admin_users is
  'Activora platform admin team members with role-based access.';

comment on table public.admin_user_audit_log is
  'Audit trail for admin user lifecycle events (invites, role changes, access disabled).';

-- RLS policies to be added when production auth is wired.
