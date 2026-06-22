-- Normal clubs connect their own GoCardless account via OAuth (club_oauth).
-- platform_managed remains for Activora-operated mandate flows only.

alter table public.providers
  alter column payment_model set default 'club_oauth';

-- Undo 00052 backfill for clubs without a real GoCardless merchant connection.
update public.providers
set
  payment_model = 'club_oauth',
  gocardless_status = case
    when coalesce(gocardless_merchant_id, '') <> ''
      and gocardless_status in ('connected', 'pending_setup', 'action_required')
      then gocardless_status
    else 'not_connected'
  end,
  payment_method_gocardless_dd = case
    when coalesce(gocardless_merchant_id, '') <> ''
      and gocardless_status = 'connected'
      then true
    else false
  end,
  preferred_payment_provider = case
    when coalesce(gocardless_merchant_id, '') <> ''
      and gocardless_status = 'connected'
      then 'gocardless'
    when stripe_connect_status in ('connected', 'payouts_enabled')
      then 'stripe'
    else coalesce(nullif(preferred_payment_provider, 'gocardless'), 'stripe')
  end
where payment_model = 'platform_managed'
  and coalesce(gocardless_merchant_id, '') = '';

comment on column public.providers.payment_model is
  'club_oauth = club connects GoCardless via OAuth; platform_managed = Activora-operated mandates.';
