-- Ensure authenticated users can always read own row; admins can read all.
-- Self: using (id = auth.uid()); admin: security definer is_admin().

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'ADMIN'
  );
$$;

drop policy if exists "Users are viewable by authenticated users" on public.users;

create policy "users_select_own_or_admin"
  on public.users
  for select
  to authenticated
  using (id = auth.uid() or public.is_admin());
