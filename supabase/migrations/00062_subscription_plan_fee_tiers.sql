-- Align subscription plan booking fee tiers with commercial model:
-- Free 2.5%, Pro 2%, Franchisor 1.5%, Enterprise 1%

update public.subscription_plans
set booking_fee_percent = 2
where slug = 'PRO';

update public.subscription_plans
set booking_fee_percent = 1.5
where slug = 'FRANCHISOR';

update public.subscription_plans
set booking_fee_percent = 1
where slug = 'ENTERPRISE';

comment on column public.subscription_plans.booking_fee_percent is
  'Platform booking fee percent by plan tier: Free 2.5%, Pro 2%, Franchisor 1.5%, Enterprise 1%.';
