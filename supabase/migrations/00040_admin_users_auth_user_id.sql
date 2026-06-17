-- Link admin_users rows to Supabase Auth (auth.users.id)

alter table public.admin_users
  add column if not exists auth_user_id uuid;

create unique index if not exists admin_users_auth_user_id_idx
  on public.admin_users (auth_user_id)
  where auth_user_id is not null;

do $$
begin
  alter table public.admin_users
    add constraint admin_users_auth_user_id_fkey
    foreign key (auth_user_id) references auth.users (id) on delete set null;
exception
  when duplicate_object then null;
end $$;

comment on column public.admin_users.auth_user_id is
  'Supabase Auth user id (auth.users.id) used for staff sign-in.';
