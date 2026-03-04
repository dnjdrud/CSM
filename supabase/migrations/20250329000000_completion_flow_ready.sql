-- Completion flow readiness: ensure signup_requests insert for anon, indexes, and posts select for authenticated.
-- Run after 20250328000000_remove_invite_codes.sql and 20250308000000_signup_approval.sql.

-- 1) signup_requests: anon/authenticated can insert (request access without login)
--    (Already in 20250328000000; idempotent recreate if missing)
drop policy if exists "signup_requests_insert_anon" on public.signup_requests;
create policy "signup_requests_insert_anon"
  on public.signup_requests for insert
  to anon, authenticated
  with check (true);

-- 2) approval_tokens: index for token lookup (already in 20250308000000; no-op if exists)
create index if not exists idx_approval_tokens_token on public.approval_tokens(token);
create index if not exists idx_approval_tokens_expires_at on public.approval_tokens(expires_at);

-- 3) posts: ensure authenticated can select (visibility + hidden_at from 20250228000002)
--    No change if policies already exist; this is a no-op comment.
--    If you see "feed empty" for logged-in users, verify:
--    - posts_select_public_members: visibility in ('PUBLIC','MEMBERS') and (hidden_at is null or author_id = auth.uid())
--    - Session cookies are set (auth/callback or completion route sets them).
