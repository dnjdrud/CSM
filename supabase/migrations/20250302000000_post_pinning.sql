-- Pinned post: one global pinned post at top of feed. Admin-only pin/unpin.

alter table public.posts
  add column if not exists pinned_at timestamptz,
  add column if not exists pinned_by uuid references public.users(id) on delete set null;

create index if not exists idx_posts_pinned_at on public.posts(pinned_at desc) where pinned_at is not null;
