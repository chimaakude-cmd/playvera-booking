-- Provider organisation type: club | franchise | enterprise

alter table public.providers
  add column if not exists organisation_type text not null default 'club',
  add column if not exists parent_provider_id uuid references public.providers (id) on delete set null;

alter table public.providers
  drop constraint if exists providers_organisation_type_check;

alter table public.providers
  add constraint providers_organisation_type_check
  check (organisation_type in ('club', 'franchise', 'enterprise'));

update public.providers
set organisation_type = 'club'
where organisation_type is null;

comment on column public.providers.organisation_type is
  'Admin providers tab: club (single location) | franchise (multi-club operator) | enterprise (council/trust/large operator)';

comment on column public.providers.parent_provider_id is
  'When set, this club provider belongs to a franchise or enterprise parent provider.';

create index if not exists idx_providers_organisation_type
  on public.providers (organisation_type);

create index if not exists idx_providers_parent_provider
  on public.providers (parent_provider_id);
