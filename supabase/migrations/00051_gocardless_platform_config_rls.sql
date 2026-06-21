-- Fix GoCardless platform admin tables: RLS was enabled in 00050 without grants or policies,
-- causing "permission denied for table public.gocardless_platform_config" from API routes.
-- Access is server-only via SUPABASE_SERVICE_ROLE_KEY + admin auth on API routes.

alter table public.gocardless_platform_config disable row level security;
alter table public.gocardless_platform_logs disable row level security;

grant all on table public.gocardless_platform_config to service_role;
grant all on table public.gocardless_platform_logs to service_role;

grant all on table public.gocardless_platform_config to authenticated;
grant all on table public.gocardless_platform_logs to authenticated;
