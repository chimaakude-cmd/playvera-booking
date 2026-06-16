-- =============================================================================
-- Activora Supabase Storage buckets
-- =============================================================================
-- Creates public-read buckets for session images, provider logos, and email
-- assets. child-documents is intentionally excluded for now.
--
-- Apply after 00001_activora_schema.sql via Supabase SQL Editor.
-- Buckets can also be created in Dashboard → Storage (see STORAGE_SETUP.md).
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'session-images',
    'session-images',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'provider-logos',
    'provider-logos',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'email-assets',
    'email-assets',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Public read (anyone can load image URLs in the browser)
-- ---------------------------------------------------------------------------

drop policy if exists "Public read session-images" on storage.objects;
create policy "Public read session-images"
on storage.objects
for select
to public
using (bucket_id = 'session-images');

drop policy if exists "Public read provider-logos" on storage.objects;
create policy "Public read provider-logos"
on storage.objects
for select
to public
using (bucket_id = 'provider-logos');

drop policy if exists "Public read email-assets" on storage.objects;
create policy "Public read email-assets"
on storage.objects
for select
to public
using (bucket_id = 'email-assets');

-- ---------------------------------------------------------------------------
-- Upload / delete (anon until auth ships — tighten to authenticated later)
-- ---------------------------------------------------------------------------

drop policy if exists "Anon upload session-images" on storage.objects;
create policy "Anon upload session-images"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'session-images');

drop policy if exists "Anon delete session-images" on storage.objects;
create policy "Anon delete session-images"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'session-images');

drop policy if exists "Anon upload provider-logos" on storage.objects;
create policy "Anon upload provider-logos"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'provider-logos');

drop policy if exists "Anon delete provider-logos" on storage.objects;
create policy "Anon delete provider-logos"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'provider-logos');

drop policy if exists "Anon upload email-assets" on storage.objects;
create policy "Anon upload email-assets"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'email-assets');

drop policy if exists "Anon delete email-assets" on storage.objects;
create policy "Anon delete email-assets"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'email-assets');

-- ---------------------------------------------------------------------------
-- sessions.images JSON shape (stored in DB, not in Storage)
-- ---------------------------------------------------------------------------
-- {
--   "mainImage": "https://...supabase.co/storage/v1/object/public/session-images/uploads/....jpg",
--   "extraImages": ["https://...", "..."]
-- }
--
-- mainImage is required when publishing. extraImages holds up to 5 gallery URLs.

comment on column public.sessions.images is
  'Public image URLs from Supabase Storage (session-images bucket). Shape: { mainImage, extraImages }.';
