-- Platform message templates (Activora)
-- Extends club communications with platform-level defaults and provider overrides.

create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('platform', 'provider')),
  provider_id uuid references public.providers(id) on delete cascade,
  template_key text not null check (template_key in ('A','B','C','D','E','F','G','H','I','J','K','L','M')),
  channel text not null default 'email' check (channel in ('email', 'sms', 'whatsapp')),
  subject text not null default '',
  body text not null default '',
  enabled boolean not null default true,
  send_delay text not null default 'immediate',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint message_templates_scope_provider check (
    (scope = 'platform' and provider_id is null) or
    (scope = 'provider' and provider_id is not null)
  )
);

create unique index if not exists idx_message_templates_platform_key
  on public.message_templates (template_key)
  where scope = 'platform';

create unique index if not exists idx_message_templates_provider_key
  on public.message_templates (provider_id, template_key)
  where scope = 'provider';

create table if not exists public.provider_template_settings (
  provider_id uuid not null references public.providers(id) on delete cascade,
  template_key text not null check (template_key in ('A','B','C','D','E','F','G','H','I','J','K','L','M')),
  uses_default boolean not null default true,
  primary key (provider_id, template_key)
);

create index if not exists idx_provider_template_settings_provider
  on public.provider_template_settings (provider_id);

-- Future: template delivery analytics
-- create table public.message_template_analytics (...)
