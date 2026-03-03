-- Phase 4-5: Moderation reports and post hiding. Admin bootstrap uses public.users.role = 'ADMIN'.

-- Reports table (RLS: insert when reporter_id = auth.uid(); select/update for ADMIN only)
create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('REPORT_POST', 'REPORT_COMMENT')),
  reporter_id uuid not null references public.users(id) on delete cascade,
  target_user_id uuid references public.users(id) on delete set null,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text,
  status text not null default 'OPEN' check (status in ('OPEN', 'RESOLVED')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.users(id) on delete set null
);

-- Posts: allow hiding (hidden posts excluded from feed for non-admins via RLS or app)
alter table public.posts
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_by uuid references public.users(id) on delete set null;

create index if not exists idx_moderation_reports_status on public.moderation_reports(status);
create index if not exists idx_moderation_reports_created_at on public.moderation_reports(created_at desc);

alter table public.moderation_reports enable row level security;

-- Reporter can insert their own report only
create policy "moderation_reports_insert"
  on public.moderation_reports for insert to authenticated
  with check (reporter_id = auth.uid());

-- Only admins can select/update (resolve)
create policy "moderation_reports_select_admin"
  on public.moderation_reports for select to authenticated
  using (
    (select role from public.users where id = auth.uid()) = 'ADMIN'
  );

create policy "moderation_reports_update_admin"
  on public.moderation_reports for update to authenticated
  using (
    (select role from public.users where id = auth.uid()) = 'ADMIN'
  );

-- Posts: hide from normal users when hidden_at is set (RLS: add condition to existing select policies)
-- We need to exclude hidden posts for non-authors. Easiest: add to each select policy "and (hidden_at is null or author_id = auth.uid())"
-- So we drop and recreate the post select policies to include hidden_at.
drop policy if exists "posts_select_public_members" on public.posts;
drop policy if exists "posts_select_private" on public.posts;
drop policy if exists "posts_select_followers" on public.posts;

create policy "posts_select_public_members"
  on public.posts for select to authenticated
  using (
    visibility in ('PUBLIC', 'MEMBERS')
    and (hidden_at is null or author_id = auth.uid())
  );

create policy "posts_select_private"
  on public.posts for select to authenticated
  using (
    visibility = 'PRIVATE' and author_id = auth.uid()
    and (hidden_at is null or author_id = auth.uid())
  );

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
    and (hidden_at is null or author_id = auth.uid())
  );

-- Admins can update posts (for hide/unhide)
create policy "posts_update_admin"
  on public.posts for update to authenticated
  using ( (select role from public.users where id = auth.uid()) = 'ADMIN' );
