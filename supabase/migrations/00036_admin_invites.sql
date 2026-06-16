-- Admin invite tokens (Supabase-backed; replaces filesystem .data/admin-users.json)

alter type public.platform_admin_role add value if not exists 'read_only';

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

grant select, insert, update, delete on table public.admin_users to anon, authenticated;
grant select, insert, update, delete on table public.admin_user_audit_log to anon, authenticated;
grant select, insert, update, delete on table public.admin_invites to anon, authenticated;

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
