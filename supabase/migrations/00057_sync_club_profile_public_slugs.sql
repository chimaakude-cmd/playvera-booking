-- Sync provider and club profile public slugs; publish profiles that have slugs but are still draft.
-- Backward compatible: works with or without published_at and visibility columns.
-- Idempotent: safe to rerun.

alter table public.club_profiles
  add column if not exists published_at timestamptz;

do $migrate$
declare
  has_published_at boolean;
  has_visibility boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'club_profiles'
      and column_name = 'published_at'
  ) into has_published_at;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'club_profiles'
      and column_name = 'visibility'
  ) into has_visibility;

  if has_visibility and has_published_at then
    update public.club_profiles cp
    set
      public_slug = coalesce(
        nullif(trim(cp.public_slug), ''),
        nullif(trim(p.slug), ''),
        lower(regexp_replace(trim(p.name), '[^a-zA-Z0-9]+', '-', 'g'))
      ),
      published = true,
      visibility = 'published'::public.club_profile_visibility,
      published_at = coalesce(cp.published_at, now()),
      updated_at = now()
    from public.providers p
    where p.id = cp.provider_id
      and (
        cp.public_slug is null
        or trim(cp.public_slug) = ''
        or cp.visibility = 'draft'::public.club_profile_visibility
        or cp.published = false
        or (
          p.slug is not null
          and trim(p.slug) <> ''
          and trim(p.slug) <> trim(cp.public_slug)
        )
      );
  elsif has_visibility then
    update public.club_profiles cp
    set
      public_slug = coalesce(
        nullif(trim(cp.public_slug), ''),
        nullif(trim(p.slug), ''),
        lower(regexp_replace(trim(p.name), '[^a-zA-Z0-9]+', '-', 'g'))
      ),
      published = true,
      visibility = 'published'::public.club_profile_visibility,
      updated_at = now()
    from public.providers p
    where p.id = cp.provider_id
      and (
        cp.public_slug is null
        or trim(cp.public_slug) = ''
        or cp.visibility = 'draft'::public.club_profile_visibility
        or cp.published = false
        or (
          p.slug is not null
          and trim(p.slug) <> ''
          and trim(p.slug) <> trim(cp.public_slug)
        )
      );
  elsif has_published_at then
    update public.club_profiles cp
    set
      public_slug = coalesce(
        nullif(trim(cp.public_slug), ''),
        nullif(trim(p.slug), ''),
        lower(regexp_replace(trim(p.name), '[^a-zA-Z0-9]+', '-', 'g'))
      ),
      published = true,
      published_at = coalesce(cp.published_at, now()),
      updated_at = now()
    from public.providers p
    where p.id = cp.provider_id
      and (
        cp.public_slug is null
        or trim(cp.public_slug) = ''
        or cp.published = false
        or (
          p.slug is not null
          and trim(p.slug) <> ''
          and trim(p.slug) <> trim(cp.public_slug)
        )
      );
  else
    update public.club_profiles cp
    set
      public_slug = coalesce(
        nullif(trim(cp.public_slug), ''),
        nullif(trim(p.slug), ''),
        lower(regexp_replace(trim(p.name), '[^a-zA-Z0-9]+', '-', 'g'))
      ),
      published = true,
      updated_at = now()
    from public.providers p
    where p.id = cp.provider_id
      and (
        cp.public_slug is null
        or trim(cp.public_slug) = ''
        or cp.published = false
        or (
          p.slug is not null
          and trim(p.slug) <> ''
          and trim(p.slug) <> trim(cp.public_slug)
        )
      );
  end if;
end $migrate$;

update public.providers p
set
  slug = cp.public_slug,
  updated_at = now()
from public.club_profiles cp
where cp.provider_id = p.id
  and cp.public_slug is not null
  and trim(cp.public_slug) <> ''
  and (
    p.slug is null
    or trim(p.slug) = ''
    or trim(p.slug) <> trim(cp.public_slug)
  );
