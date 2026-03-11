-- comment_reactions: per-comment likes
create table if not exists public.comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type = 'LIKE'),
  created_at timestamptz not null default now(),
  unique (comment_id, user_id, type)
);
alter table public.comment_reactions enable row level security;
create policy "cr_select" on public.comment_reactions for select to authenticated using (true);
create policy "cr_insert" on public.comment_reactions for insert to authenticated with check (user_id = auth.uid());
create policy "cr_delete" on public.comment_reactions for delete to authenticated using (user_id = auth.uid());

-- direct_messages: 1:1 DMs
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint dm_no_self_message check (sender_id != recipient_id)
);
alter table public.direct_messages enable row level security;
create policy "dm_select" on public.direct_messages for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy "dm_insert" on public.direct_messages for insert to authenticated
  with check (sender_id = auth.uid());
create policy "dm_update_read" on public.direct_messages for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());
