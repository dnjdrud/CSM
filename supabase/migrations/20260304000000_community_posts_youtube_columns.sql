-- Community split-view feed (left: cards, right: YouTube). Add youtube/thumbnail to existing posts.
-- Existing table: public.posts (id, author_id, category, content, title, visibility, tags, ...).
-- Add columns only; do not create a new posts table.

-- Columns for YouTube embed + thumbnail (youtube_id stores only video ID e.g. "dQw4w9WgXcQ", not full URL)
alter table public.posts
  add column if not exists thumbnail_url text,
  add column if not exists youtube_id text,
  add column if not exists updated_at timestamptz not null default now();

-- Index: community feed ordered by created_at; filter/join by youtube_id
create index if not exists idx_posts_created_at_desc on public.posts(created_at desc);
create index if not exists idx_posts_youtube_id on public.posts(youtube_id) where youtube_id is not null;

-- Optional: trigger to keep updated_at in sync (idempotent)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- RLS: MVP read open to all (anon + authenticated) for community feed; write stays authenticated-only.
-- Existing: posts_select for authenticated. Add anon read for public community listing.
drop policy if exists "posts_select_public" on public.posts;
create policy "posts_select_public"
  on public.posts for select to anon
  using (true);

comment on column public.posts.youtube_id is 'YouTube video ID only (e.g. dQw4w9WgXcQ). Do not store full URL.';
