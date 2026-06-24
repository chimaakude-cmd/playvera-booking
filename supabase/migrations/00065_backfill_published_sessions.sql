-- Backfill sessions that were saved with dates/tickets but published=false
-- (e.g. visibility toggled in UI via localStorage only before this fix).
-- Idempotent: only updates rows still marked unpublished.

do $migrate$
declare
  has_sessions boolean;
  has_session_dates boolean;
  has_tickets boolean;
  has_moderation_status boolean;
  has_removed_at boolean;
begin
  select exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'sessions'
  ) into has_sessions;

  if not has_sessions then
    return;
  end if;

  select exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'session_dates'
  ) into has_session_dates;

  select exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'tickets'
  ) into has_tickets;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sessions'
      and column_name = 'moderation_status'
  ) into has_moderation_status;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sessions'
      and column_name = 'removed_at'
  ) into has_removed_at;

  if has_session_dates and has_tickets then
    if has_moderation_status and has_removed_at then
      execute $sql$
        update public.sessions s
        set published = true,
            updated_at = now()
        where s.published = false
          and coalesce(s.moderation_status::text, 'active') = 'active'
          and s.removed_at is null
          and exists (
            select 1 from public.session_dates sd where sd.session_id = s.id
          )
          and exists (
            select 1 from public.tickets t where t.session_id = s.id
          )
      $sql$;
    elsif has_removed_at then
      execute $sql$
        update public.sessions s
        set published = true,
            updated_at = now()
        where s.published = false
          and s.removed_at is null
          and exists (
            select 1 from public.session_dates sd where sd.session_id = s.id
          )
          and exists (
            select 1 from public.tickets t where t.session_id = s.id
          )
      $sql$;
    else
      execute $sql$
        update public.sessions s
        set published = true,
            updated_at = now()
        where s.published = false
          and exists (
            select 1 from public.session_dates sd where sd.session_id = s.id
          )
          and exists (
            select 1 from public.tickets t where t.session_id = s.id
          )
      $sql$;
    end if;
  end if;
end $migrate$;
