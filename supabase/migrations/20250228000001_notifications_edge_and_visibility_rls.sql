-- Phase 4-4: Notifications only via Edge Function (no direct insert); posts visibility RLS.

-- 1) Notifications: remove direct insert from app (Edge Function uses service role, bypasses RLS)
drop policy if exists "notifications_insert" on public.notifications;
-- Keep: notifications_select (recipient only), notifications_update (recipient only)

-- 2) Posts: replace broad select with visibility-based policies
drop policy if exists "posts_select" on public.posts;

-- PUBLIC and MEMBERS: any authenticated user can select
create policy "posts_select_public_members"
  on public.posts for select to authenticated
  using (
    visibility in ('PUBLIC', 'MEMBERS')
  );

-- PRIVATE: only author can select
create policy "posts_select_private"
  on public.posts for select to authenticated
  using (
    visibility = 'PRIVATE' and author_id = auth.uid()
  );

-- FOLLOWERS: author or users who follow the author can select
create policy "posts_select_followers"
  on public.posts for select to authenticated
  using (
    visibility = 'FOLLOWERS' and (
      author_id = auth.uid()
      or exists (
        select 1 from public.follows f
        where f.following_id = posts.author_id and f.follower_id = auth.uid()
      )
    )
  );
