-- Club profile contact, social links, and verification status

create type public.club_verification_status as enum (
  'unverified',
  'verified',
  'premium_verified'
);

alter table public.club_profiles
  add column if not exists contact jsonb not null default '{}'::jsonb,
  add column if not exists social_links jsonb not null default '{}'::jsonb,
  add column if not exists verification_status public.club_verification_status
    not null default 'unverified';

comment on column public.club_profiles.contact is
  'Contact methods: email (required), phone, whatsapp, website.';

comment on column public.club_profiles.social_links is
  'Canonical social profile URLs keyed by platform.';

comment on column public.club_profiles.verification_status is
  'Trust state for future ownership verification workflows.';

-- Legacy scalar columns remain for backward compatibility during migration.
