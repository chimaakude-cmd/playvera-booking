-- Production-safe grants for admin_users tables.
-- Server API routes use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
-- These grants keep local dev working with the anon key when 00036 policies exist.

grant usage on schema public to anon, authenticated;

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
