-- Franchisee clubs: explicit flag + parent link required for franchisor control.

alter table public.providers
  add column if not exists managed_by_franchisor boolean not null default false;

comment on column public.providers.managed_by_franchisor is
  'When true and parent_provider_id is set, the club is managed by the franchisor parent provider.';

create index if not exists idx_providers_managed_by_franchisor
  on public.providers (managed_by_franchisor)
  where managed_by_franchisor = true;
