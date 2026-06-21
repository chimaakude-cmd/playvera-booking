-- Per-activity payment provider selection (Stripe | GoCardless | both | club default)

alter table public.sessions
  add column if not exists activity_payment_provider text not null default 'club_default';

alter table public.sessions
  drop constraint if exists sessions_activity_payment_provider_check;

alter table public.sessions
  add constraint sessions_activity_payment_provider_check
  check (
    activity_payment_provider in (
      'club_default',
      'stripe',
      'gocardless',
      'both'
    )
  );

comment on column public.sessions.activity_payment_provider is
  'How parents pay for this activity: club_default | stripe | gocardless | both.';
