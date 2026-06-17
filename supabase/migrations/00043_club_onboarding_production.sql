-- Club onboarding production: link providers to Supabase Auth owners

alter table public.providers
  add column if not exists auth_user_id uuid;

create unique index if not exists providers_auth_user_id_idx
  on public.providers (auth_user_id)
  where auth_user_id is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'providers_auth_user_id_fkey'
  ) then
    alter table public.providers
      add constraint providers_auth_user_id_fkey
      foreign key (auth_user_id) references auth.users (id) on delete set null;
  end if;
end $$;

comment on column public.providers.auth_user_id is
  'Supabase Auth user id for the club owner account created during onboarding.';

-- Dev/local insert policies missing from 00032 (service role bypasses RLS in production API)
drop policy if exists "DEV ONLY anon insert club_profiles" on public.club_profiles;
create policy "DEV ONLY anon insert club_profiles"
on public.club_profiles
for insert
to anon, authenticated
with check (true);

drop policy if exists "DEV ONLY anon insert club_team_members" on public.club_team_members;
create policy "DEV ONLY anon insert club_team_members"
on public.club_team_members
for insert
to anon, authenticated
with check (true);
