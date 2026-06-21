-- Apply GoCardless platform config migrations (00050 + 00051)
-- Run in Supabase SQL editor when deploying admin-first GoCardless setup.

\i supabase/migrations/00050_gocardless_platform_config.sql
\i supabase/migrations/00051_gocardless_platform_config_rls.sql

select
  id,
  environment,
  platform_enabled,
  platform_fee_percent,
  connection_status
from public.gocardless_platform_config;
