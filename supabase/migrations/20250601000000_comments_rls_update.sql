-- Ensure comments UPDATE policy exists (for updateComment). Idempotent.
-- SELECT/INSERT/DELETE are in 20250228000000_social_tables.sql.
drop policy if exists "comments_update" on public.comments;
create policy "comments_update" on public.comments
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());
