-- Public read access for published booking sessions (parent-facing /book/{id})
-- Backward compatible: works with or without moderation_status, removed_at, status, etc.
-- Idempotent: safe to rerun. Follows information_schema pattern from 00057 / 00058.

do $migrate$
declare
  has_sessions boolean;
  has_session_dates boolean;
  has_tickets boolean;
  has_published boolean;
  has_moderation_status boolean;
  has_removed_at boolean;
  has_status boolean;
  has_deleted_at boolean;
  has_archived boolean;
  has_visible boolean;
  session_conditions text[] := array[]::text[];
  related_conditions text[] := array[]::text[];
  session_using text;
  related_using text;
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
      and column_name = 'published'
  ) into has_published;

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

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sessions'
      and column_name = 'status'
  ) into has_status;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sessions'
      and column_name = 'deleted_at'
  ) into has_deleted_at;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sessions'
      and column_name = 'archived'
  ) into has_archived;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sessions'
      and column_name = 'visible'
  ) into has_visible;

  if has_published then
    session_conditions := array_append(session_conditions, 'published = true');
    related_conditions := array_append(related_conditions, 's.published = true');
  elsif has_status then
    session_conditions := array_append(session_conditions, 'status = ''published''');
    related_conditions := array_append(related_conditions, 's.status = ''published''');
  elsif has_visible then
    session_conditions := array_append(session_conditions, 'visible = true');
    related_conditions := array_append(related_conditions, 's.visible = true');
  else
    session_conditions := array_append(session_conditions, 'true');
    related_conditions := array_append(related_conditions, 'true');
  end if;

  if has_moderation_status then
    session_conditions := array_append(
      session_conditions,
      'coalesce(moderation_status::text, ''active'') <> ''removed'''
    );
    related_conditions := array_append(
      related_conditions,
      'coalesce(s.moderation_status::text, ''active'') <> ''removed'''
    );
  elsif has_removed_at then
    session_conditions := array_append(session_conditions, 'removed_at is null');
    related_conditions := array_append(related_conditions, 's.removed_at is null');
  end if;

  if has_deleted_at then
    session_conditions := array_append(session_conditions, 'deleted_at is null');
    related_conditions := array_append(related_conditions, 's.deleted_at is null');
  end if;

  if has_archived then
    session_conditions := array_append(
      session_conditions,
      'coalesce(archived, false) = false'
    );
    related_conditions := array_append(
      related_conditions,
      'coalesce(s.archived, false) = false'
    );
  end if;

  if has_status then
    session_conditions := array_append(
      session_conditions,
      'coalesce(status, ''published'') not in (''removed'', ''archived'', ''deleted'', ''draft'')'
    );
    related_conditions := array_append(
      related_conditions,
      'coalesce(s.status, ''published'') not in (''removed'', ''archived'', ''deleted'', ''draft'')'
    );
  end if;

  if has_visible and has_published then
    session_conditions := array_append(session_conditions, 'coalesce(visible, true) = true');
    related_conditions := array_append(related_conditions, 'coalesce(s.visible, true) = true');
  end if;

  session_using := array_to_string(session_conditions, ' and ');
  related_using := array_to_string(related_conditions, ' and ');

  execute 'drop policy if exists "public_read_published_sessions" on public.sessions';
  execute format(
    $sql$
      create policy "public_read_published_sessions"
      on public.sessions
      for select
      to anon, authenticated
      using (%s)
    $sql$,
    session_using
  );

  if has_session_dates then
    execute 'drop policy if exists "public_read_published_session_dates" on public.session_dates';
    execute format(
      $sql$
        create policy "public_read_published_session_dates"
        on public.session_dates
        for select
        to anon, authenticated
        using (
          exists (
            select 1
            from public.sessions s
            where s.id = session_dates.session_id
              and %s
          )
        )
      $sql$,
      related_using
    );
  end if;

  if has_tickets then
    execute 'drop policy if exists "public_read_published_tickets" on public.tickets';
    execute format(
      $sql$
        create policy "public_read_published_tickets"
        on public.tickets
        for select
        to anon, authenticated
        using (
          exists (
            select 1
            from public.sessions s
            where s.id = tickets.session_id
              and %s
          )
        )
      $sql$,
      related_using
    );
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'sessions'
      and policyname = 'public_read_published_sessions'
  ) then
    execute $sql$
      comment on policy "public_read_published_sessions" on public.sessions is
        'Allow anonymous reads of published, non-removed sessions for public booking pages.'
    $sql$;
  end if;
end $migrate$;
