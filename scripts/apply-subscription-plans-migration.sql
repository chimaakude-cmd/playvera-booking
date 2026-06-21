-- =============================================================================
-- Playvera / Activora — Subscription plans migration
-- =============================================================================
-- Paste this ENTIRE file into Supabase Dashboard → SQL Editor → Run.
--
-- Prerequisites:
--   - Base schema migration 00001_activora_schema.sql already applied
--     (provides public.set_updated_at()).
--   - provider_subscriptions table exists (migration 00030+).
--   - platform_settings table exists (migration 00042+).
--
-- After running:
--   1. Confirm table exists: subscription_plans (4 rows)
--   2. Redeploy so /api/subscription-plans routes are live
-- =============================================================================

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  description text not null default '',
  monthly_price numeric(10, 2) not null default 0,
  monthly_price_is_minimum boolean not null default false,
  booking_fee_percent numeric(5, 2) not null default 2.5,
  activity_limit integer,
  club_limit integer,
  support_level text not null default 'standard'
    check (support_level in ('standard', 'priority', 'urgent')),
  dedicated_manager boolean not null default false,
  quarterly_calls_enabled boolean not null default false,
  early_access_enabled boolean not null default false,
  unlimited_activities boolean not null default false,
  unlimited_clubs boolean not null default false,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  response_target_hours integer,
  priority_support boolean not null default false,
  urgent_support boolean not null default false,
  features jsonb not null default '[]'::jsonb,
  cta text not null default '',
  highlighted boolean not null default false,
  contact_sales boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists subscription_plans_set_updated_at on public.subscription_plans;
create trigger subscription_plans_set_updated_at
  before update on public.subscription_plans
  for each row execute function public.set_updated_at();

comment on table public.subscription_plans is
  'Platform subscription plans — prices, booking fees, activity/club limits, and feature flags.';

insert into public.subscription_plans (
  slug,
  display_name,
  description,
  monthly_price,
  monthly_price_is_minimum,
  booking_fee_percent,
  activity_limit,
  club_limit,
  support_level,
  dedicated_manager,
  quarterly_calls_enabled,
  early_access_enabled,
  unlimited_activities,
  unlimited_clubs,
  enabled,
  sort_order,
  response_target_hours,
  priority_support,
  urgent_support,
  features,
  cta,
  highlighted,
  contact_sales
)
values
  (
    'FREE',
    'Free',
    'Everything you need to start taking bookings online.',
    0,
    false,
    2.5,
    20,
    null,
    'standard',
    false,
    false,
    false,
    false,
    false,
    true,
    1,
    null,
    false,
    false,
    '["Online bookings","Public profile & widget","Payments & basic reporting","Standard support","Staff permissions","Up to 20 activities"]'::jsonb,
    'Get started free',
    false,
    false
  ),
  (
    'PRO',
    'Pro',
    'Unlimited activities and priority support for growing clubs.',
    19.99,
    false,
    2.5,
    null,
    null,
    'priority',
    false,
    true,
    true,
    true,
    false,
    true,
    2,
    null,
    true,
    false,
    '["Unlimited activities","Priority support","Enhanced reporting","Expanded admin tools","Early feature access","Quarterly strategy calls","Unlimited staff"]'::jsonb,
    'Start Pro trial',
    true,
    false
  ),
  (
    'FRANCHISOR',
    'Franchisor',
    'Multi-location management for franchise operators.',
    149,
    false,
    2.5,
    null,
    25,
    'urgent',
    true,
    true,
    true,
    true,
    false,
    true,
    3,
    null,
    false,
    true,
    '["Franchise dashboard","Central reporting","Up to 25 managed clubs","Dedicated account manager","Urgent support","Quarterly strategy calls","Early feature access"]'::jsonb,
    'Choose Franchisor',
    false,
    false
  ),
  (
    'ENTERPRISE',
    'Enterprise',
    'Dedicated support and advanced controls at scale.',
    499,
    true,
    2.5,
    null,
    null,
    'urgent',
    true,
    true,
    true,
    true,
    true,
    true,
    4,
    6,
    false,
    true,
    '["Unlimited clubs","Dedicated account manager","6-hour response target","Enterprise reporting","Bulk import tools","Quarterly strategy calls","Early feature access"]'::jsonb,
    'Contact sales',
    false,
    true
  )
on conflict (slug) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  monthly_price = excluded.monthly_price,
  monthly_price_is_minimum = excluded.monthly_price_is_minimum,
  booking_fee_percent = excluded.booking_fee_percent,
  activity_limit = excluded.activity_limit,
  club_limit = excluded.club_limit,
  support_level = excluded.support_level,
  dedicated_manager = excluded.dedicated_manager,
  quarterly_calls_enabled = excluded.quarterly_calls_enabled,
  early_access_enabled = excluded.early_access_enabled,
  unlimited_activities = excluded.unlimited_activities,
  unlimited_clubs = excluded.unlimited_clubs,
  enabled = excluded.enabled,
  sort_order = excluded.sort_order,
  response_target_hours = excluded.response_target_hours,
  priority_support = excluded.priority_support,
  urgent_support = excluded.urgent_support,
  features = excluded.features,
  cta = excluded.cta,
  highlighted = excluded.highlighted,
  contact_sales = excluded.contact_sales;

update public.provider_subscriptions
set plan = 'FREE'
where upper(plan) in ('STARTER', 'FREE');

update public.provider_subscriptions
set plan = 'FRANCHISOR'
where upper(plan) in ('FRANCHISE', 'FRANCHISOR');

update public.platform_settings
set default_fees = '{"STARTER":2.5,"PRO":2.5,"FRANCHISE":2.5,"ENTERPRISE":2.5}'::jsonb
where id = 1;

alter table public.subscription_plans enable row level security;

grant select on table public.subscription_plans to anon, authenticated;

drop policy if exists "public read subscription_plans" on public.subscription_plans;
create policy "public read subscription_plans"
on public.subscription_plans for select to anon, authenticated
using (enabled = true);

select slug, display_name, monthly_price, booking_fee_percent, activity_limit, club_limit
from public.subscription_plans
order by sort_order;
