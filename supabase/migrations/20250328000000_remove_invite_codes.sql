-- Remove invite code feature. App is admin-approval only (signup_requests).
-- Run after 20250308000000_signup_approval.sql and 20250302001000_invite_only_users_rpc.sql.

-- 1) Drop users policy that references invite_code_id, then drop column
drop policy if exists "Users can update own profile" on public.users;
alter table public.users drop column if exists invite_code_id;
-- Recreate simple update-own-profile policy
create policy "Users can update own profile"
  on public.users for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 2) Drop RLS policies on invite_codes (so we can drop the table)
drop policy if exists "invite_codes_insert_admin" on public.invite_codes;
drop policy if exists "invite_codes_select_admin" on public.invite_codes;
drop policy if exists "invite_codes_update_admin" on public.invite_codes;
drop policy if exists "invite_codes_consume" on public.invite_codes;

-- 3) Drop invite_codes table
drop table if exists public.invite_codes;

-- 4) Drop RPC create_user_with_invite if it exists (from 20250302001000)
drop function if exists public.create_user_with_invite(text, text, text, text, text);

-- 5) Allow anon/authenticated to INSERT into signup_requests (request access without login)
--    App currently uses service role for insert; this allows future client-side or anon insert.
drop policy if exists "signup_requests_insert_anon" on public.signup_requests;
create policy "signup_requests_insert_anon"
  on public.signup_requests for insert
  to anon, authenticated
  with check (true);
