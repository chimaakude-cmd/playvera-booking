-- =============================================================================
-- Playvera / Activora — Admin users production fix
-- =============================================================================
-- Paste this ENTIRE file into Supabase Dashboard → SQL Editor → Run.
--
-- Fixes: "Could not find table public.admin_users" (PostgREST PGRST205)
--
-- Prerequisites:
--   - Base schema migration 00001_activora_schema.sql already applied
--     (provides public.set_updated_at()).
--
-- After running:
--   1. Confirm tables exist: admin_users, admin_invites, admin_user_audit_log
--   2. Set SUPABASE_SERVICE_ROLE_KEY on Vercel (Production + Preview)
--   3. Redeploy so server routes pick up the service role key
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------

do $$
begin
  create type public.platform_admin_role as enum (
    'owner',
    'super_admin',
    'support_admin',
    'finance_admin',
    'content_admin'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.platform_admin_status as enum (
    'invited',
    'active',
    'disabled'
  );
exception
  when duplicate_object then null;
end $$;

alter type public.platform_admin_role add value if not exists 'read_only';

-- ---------------------------------------------------------------------------
-- admin_users
-- ---------------------------------------------------------------------------

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

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at
  before update on public.admin_users
  for each row execute function public.set_updated_at();

comment on table public.admin_users is
  'Activora platform admin team members with role-based access.';

-- ---------------------------------------------------------------------------
-- admin_user_audit_log
-- ---------------------------------------------------------------------------

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

comment on table public.admin_user_audit_log is
  'Audit trail for admin user lifecycle events (invites, role changes, access disabled).';

-- ---------------------------------------------------------------------------
-- admin_invites
-- ---------------------------------------------------------------------------

create table if not exists public.admin_invites (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  role text not null,
  token text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked')),
  invited_by text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists admin_invites_email_idx on public.admin_invites (email);
create index if not exists admin_invites_token_idx on public.admin_invites (token);
create index if not exists admin_invites_status_idx on public.admin_invites (status);

comment on table public.admin_invites is
  'Pending platform admin invites with expiring secure tokens.';

-- ---------------------------------------------------------------------------
-- Grants (service role bypasses RLS; anon/authenticated for local dev)
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on table public.admin_users to anon, authenticated, service_role;
grant select, insert, update, delete on table public.admin_user_audit_log to anon, authenticated, service_role;
grant select, insert, update, delete on table public.admin_invites to anon, authenticated, service_role;

alter table public.admin_users enable row level security;
alter table public.admin_user_audit_log enable row level security;
alter table public.admin_invites enable row level security;

drop policy if exists "DEV ONLY anon all admin_users" on public.admin_users;
create policy "DEV ONLY anon all admin_users"
on public.admin_users for all to anon, authenticated using (true) with check (true);

drop policy if exists "DEV ONLY anon all admin_user_audit_log" on public.admin_user_audit_log;
create policy "DEV ONLY anon all admin_user_audit_log"
on public.admin_user_audit_log for all to anon, authenticated using (true) with check (true);

drop policy if exists "DEV ONLY anon all admin_invites" on public.admin_invites;
create policy "DEV ONLY anon all admin_invites"
on public.admin_invites for all to anon, authenticated using (true) with check (true);

-- Production admin APIs use SUPABASE_SERVICE_ROLE_KEY server-side only (bypasses RLS).
-- Replace DEV policies with auth.uid()-based rules when platform auth ships.

-- ---------------------------------------------------------------------------
-- auth_user_id link (Supabase Auth)
-- ---------------------------------------------------------------------------

alter table public.admin_users
  add column if not exists auth_user_id uuid;

create unique index if not exists admin_users_auth_user_id_idx
  on public.admin_users (auth_user_id)
  where auth_user_id is not null;

do $$
begin
  alter table public.admin_users
    add constraint admin_users_auth_user_id_fkey
    foreign key (auth_user_id) references auth.users (id) on delete set null;
exception
  when duplicate_object then null;
end $$;

comment on column public.admin_users.auth_user_id is
  'Supabase Auth user id (auth.users.id) used for staff sign-in.';

-- ---------------------------------------------------------------------------
-- accepted_at (invite activation timestamp)
-- ---------------------------------------------------------------------------

alter table public.admin_users
  add column if not exists accepted_at timestamptz;

comment on column public.admin_users.accepted_at is
  'When the admin accepted their invite and activated their account.';

-- ---------------------------------------------------------------------------
-- Bootstrap platform owner (run once — enables magic-link sign-in)
-- ---------------------------------------------------------------------------

insert into public.admin_users (
  email,
  full_name,
  role,
  status,
  email_verified,
  accepted_at
)
values (
  'adminactivora@gmail.com',
  'Platform Admin',
  'super_admin',
  'active',
  true,
  now()
)
on conflict (email) do update set
  role = excluded.role,
  status = 'active',
  email_verified = true,
  accepted_at = coalesce(public.admin_users.accepted_at, now()),
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Verify (optional — results appear in SQL Editor output)
-- ---------------------------------------------------------------------------

select
  to_regclass('public.admin_users') as admin_users,
  to_regclass('public.admin_invites') as admin_invites,
  to_regclass('public.admin_user_audit_log') as admin_user_audit_log;

-- ---------------------------------------------------------------------------
-- platform_settings (singleton platform configuration)
-- ---------------------------------------------------------------------------

create table if not exists public.platform_settings (
  id integer primary key check (id = 1),
  platform_name text not null default 'Activora',
  support_email text not null default 'support@activora.co.uk',
  support_phone text not null default '0800 123 4567',
  platform_url text not null default 'https://activora.co.uk',
  default_currency text not null default 'GBP',
  country text not null default 'UK',
  vat_threshold numeric not null default 90000,
  marketplace_footer_text text not null default 'Powered by Activora',
  marketplace_enabled boolean not null default true,
  ai_search_assistant_enabled boolean not null default false,
  default_fees jsonb not null default '{"STARTER":2.5,"PRO":2.0,"FRANCHISE":1.5,"ENTERPRISE":1.0}'::jsonb,
  booking_question_defaults jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.admin_users (id) on delete set null
);

drop trigger if exists platform_settings_set_updated_at on public.platform_settings;
create trigger platform_settings_set_updated_at
  before update on public.platform_settings
  for each row execute function public.set_updated_at();

comment on table public.platform_settings is
  'Singleton platform configuration for Activora marketplace operations.';

insert into public.platform_settings (
  id,
  platform_name,
  support_email,
  support_phone,
  platform_url,
  default_currency,
  country,
  vat_threshold,
  marketplace_footer_text,
  marketplace_enabled,
  ai_search_assistant_enabled,
  default_fees,
  booking_question_defaults
)
values (
  1,
  'Activora',
  'support@activora.co.uk',
  '0800 123 4567',
  'https://activora.co.uk',
  'GBP',
  'UK',
  90000,
  'Powered by Activora',
  true,
  false,
  '{"STARTER":2.5,"PRO":2.0,"FRANCHISE":1.5,"ENTERPRISE":1.0}'::jsonb,
  '[]'::jsonb
)
on conflict (id) do nothing;

alter table public.platform_settings enable row level security;

grant select on table public.platform_settings to anon, authenticated;

drop policy if exists "DEV ONLY anon read platform_settings" on public.platform_settings;
create policy "DEV ONLY anon read platform_settings"
on public.platform_settings for select to anon, authenticated using (true);

select to_regclass('public.platform_settings') as platform_settings;
