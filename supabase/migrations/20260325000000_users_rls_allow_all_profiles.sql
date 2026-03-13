-- Allow all authenticated users to read any user's profile.
-- Previous policy (users_select_own_or_admin) only let users see their own row,
-- causing "Cannot coerce the result to a single JSON object" when visiting another user's profile.

drop policy if exists "users_select_own_or_admin" on public.users;

create policy "users_select_authenticated"
  on public.users
  for select
  to authenticated
  using (true);
