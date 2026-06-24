-- Public read access for published booking sessions (parent-facing /book/{id})
-- Complements DEV ONLY policies in 00005; safe for production when dev policies are removed.

drop policy if exists "public_read_published_sessions" on public.sessions;
create policy "public_read_published_sessions"
on public.sessions
for select
to anon, authenticated
using (
  published = true
  and coalesce(moderation_status, 'active') <> 'removed'
);

drop policy if exists "public_read_published_session_dates" on public.session_dates;
create policy "public_read_published_session_dates"
on public.session_dates
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.sessions s
    where s.id = session_dates.session_id
      and s.published = true
      and coalesce(s.moderation_status, 'active') <> 'removed'
  )
);

drop policy if exists "public_read_published_tickets" on public.tickets;
create policy "public_read_published_tickets"
on public.tickets
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.sessions s
    where s.id = tickets.session_id
      and s.published = true
      and coalesce(s.moderation_status, 'active') <> 'removed'
  )
);

comment on policy "public_read_published_sessions" on public.sessions is
  'Allow anonymous reads of published, non-removed sessions for public booking pages.';
