-- Apply GoCardless platform config migration (00050)
-- Run in Supabase SQL editor when deploying admin-first GoCardless setup.

\i supabase/migrations/00050_gocardless_platform_config.sql

select
  id,
  environment,
  platform_enabled,
  platform_fee_percent,
  connection_status
from public.gocardless_platform_config;
