-- Platform-wide settings (single-row singleton)

create table if not exists public.platform_settings (
  id integer primary key check (id = 1),
  platform_name text not null default 'Activora',
  support_email text not null default 'support@activora.co.uk',
  support_phone text not null default '0800 123 4567',
  platform_url text not null default 'https://activora.co.uk',
  default_currency text not null default 'GBP',
  country text not null default 'UK',
  vat_threshold numeric not null default 90000,
  marketplace_footer_text text not null default 'Powered by Activora',
  marketplace_enabled boolean not null default true,
  ai_search_assistant_enabled boolean not null default false,
  default_fees jsonb not null default '{"STARTER":2.5,"PRO":2.0,"FRANCHISE":1.5,"ENTERPRISE":1.0}'::jsonb,
  booking_question_defaults jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.admin_users (id) on delete set null
);

drop trigger if exists platform_settings_set_updated_at on public.platform_settings;
create trigger platform_settings_set_updated_at
  before update on public.platform_settings
  for each row execute function public.set_updated_at();

comment on table public.platform_settings is
  'Singleton platform configuration for Activora marketplace operations.';

insert into public.platform_settings (
  id,
  platform_name,
  support_email,
  support_phone,
  platform_url,
  default_currency,
  country,
  vat_threshold,
  marketplace_footer_text,
  marketplace_enabled,
  ai_search_assistant_enabled,
  default_fees,
  booking_question_defaults
)
values (
  1,
  'Activora',
  'support@activora.co.uk',
  '0800 123 4567',
  'https://activora.co.uk',
  'GBP',
  'UK',
  90000,
  'Powered by Activora',
  true,
  false,
  '{"STARTER":2.5,"PRO":2.0,"FRANCHISE":1.5,"ENTERPRISE":1.0}'::jsonb,
  '[]'::jsonb
)
on conflict (id) do nothing;

alter table public.platform_settings enable row level security;

grant select on table public.platform_settings to anon, authenticated;

drop policy if exists "DEV ONLY anon read platform_settings" on public.platform_settings;
create policy "DEV ONLY anon read platform_settings"
on public.platform_settings for select to anon, authenticated using (true);
