-- Phase 4-3: Social tables for posts, comments, follows, reactions, notifications.
-- Run in Supabase SQL Editor. Assumes public.users exists (id uuid primary key, name, role, bio, affiliation, created_at).

-- Posts (author_id references public.users or auth.users)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  category text not null,
  content text not null,
  title text,
  visibility text not null default 'MEMBERS',
  tags text[] default '{}',
  reflection_prompt text,
  created_at timestamptz not null default now()
);

-- Comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  parent_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Follows
create table if not exists public.follows (
  follower_id uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

-- Reactions
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id, type)
);

-- Notifications (RLS: SELECT where recipient_id = auth.uid(); INSERT with actor_id = auth.uid())
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  recipient_id uuid not null references public.users(id) on delete cascade,
  actor_id uuid not null references public.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS: enable
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.reactions enable row level security;
alter table public.notifications enable row level security;

-- Policies: allow authenticated to read posts (visibility enforced in app or via policy), insert own, etc.
-- Example posts: allow read for authenticated; insert when author_id = auth.uid()
create policy "posts_select" on public.posts for select to authenticated using (true);
create policy "posts_insert" on public.posts for insert to authenticated with check (author_id = auth.uid());

create policy "comments_select" on public.comments for select to authenticated using (true);
create policy "comments_insert" on public.comments for insert to authenticated with check (author_id = auth.uid());
create policy "comments_delete" on public.comments for delete to authenticated using (author_id = auth.uid());

create policy "follows_select" on public.follows for select to authenticated using (true);
create policy "follows_insert" on public.follows for insert to authenticated with check (follower_id = auth.uid());
create policy "follows_delete" on public.follows for delete to authenticated using (follower_id = auth.uid());

create policy "reactions_select" on public.reactions for select to authenticated using (true);
create policy "reactions_insert" on public.reactions for insert to authenticated with check (user_id = auth.uid());
create policy "reactions_delete" on public.reactions for delete to authenticated using (user_id = auth.uid());

create policy "notifications_select" on public.notifications for select to authenticated using (recipient_id = auth.uid());
create policy "notifications_insert" on public.notifications for insert to authenticated with check (actor_id = auth.uid());
create policy "notifications_update" on public.notifications for update to authenticated using (recipient_id = auth.uid());
