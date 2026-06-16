-- =============================================================================
-- Activora session RLS policies (no auth yet)
-- =============================================================================
-- Allows the anon key to create/read/update/delete sessions, dates, and tickets
-- while auth is not wired. Tighten these policies once authentication ships.
-- =============================================================================

-- providers (needed for default dev club creation)
drop policy if exists "Anon read providers" on public.providers;
create policy "Anon read providers"
on public.providers
for select
to anon, authenticated
using (true);

drop policy if exists "Anon insert providers" on public.providers;
create policy "Anon insert providers"
on public.providers
for insert
to anon, authenticated
with check (true);

-- sessions
drop policy if exists "Anon read sessions" on public.sessions;
create policy "Anon read sessions"
on public.sessions
for select
to anon, authenticated
using (true);

drop policy if exists "Anon insert sessions" on public.sessions;
create policy "Anon insert sessions"
on public.sessions
for insert
to anon, authenticated
with check (true);

drop policy if exists "Anon update sessions" on public.sessions;
create policy "Anon update sessions"
on public.sessions
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Anon delete sessions" on public.sessions;
create policy "Anon delete sessions"
on public.sessions
for delete
to anon, authenticated
using (true);

-- session_dates
drop policy if exists "Anon read session_dates" on public.session_dates;
create policy "Anon read session_dates"
on public.session_dates
for select
to anon, authenticated
using (true);

drop policy if exists "Anon insert session_dates" on public.session_dates;
create policy "Anon insert session_dates"
on public.session_dates
for insert
to anon, authenticated
with check (true);

drop policy if exists "Anon update session_dates" on public.session_dates;
create policy "Anon update session_dates"
on public.session_dates
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Anon delete session_dates" on public.session_dates;
create policy "Anon delete session_dates"
on public.session_dates
for delete
to anon, authenticated
using (true);

-- tickets
drop policy if exists "Anon read tickets" on public.tickets;
create policy "Anon read tickets"
on public.tickets
for select
to anon, authenticated
using (true);

drop policy if exists "Anon insert tickets" on public.tickets;
create policy "Anon insert tickets"
on public.tickets
for insert
to anon, authenticated
with check (true);

drop policy if exists "Anon update tickets" on public.tickets;
create policy "Anon update tickets"
on public.tickets
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Anon delete tickets" on public.tickets;
create policy "Anon delete tickets"
on public.tickets
for delete
to anon, authenticated
using (true);
