-- Optional VAT registration number on provider (club) records for finance/profile settings.

alter table public.providers
  add column if not exists vat_registration_number text;

comment on column public.providers.vat_registration_number is
  'Optional UK VAT registration number supplied by the club in Finance settings.';
