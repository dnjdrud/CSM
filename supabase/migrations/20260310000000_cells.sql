-- Add cell chat system tables: cells, cell_memberships, cell_messages

-- public.cells
create table if not exists public.cells (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('OPEN','PRIVATE')),
  title text not null,
  creator_id uuid references public.users(id) on delete cascade,
  topic_tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.cells enable row level security;

-- policies for cells are declared after related tables exist (see below)

drop policy if exists "Creator may update own cell" on public.cells;
create policy "Creator may update own cell"
  on public.cells for update
  to authenticated
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

drop policy if exists "Creator may delete own cell" on public.cells;
create policy "Creator may delete own cell"
  on public.cells for delete
  to authenticated
  using (auth.uid() = creator_id);

drop policy if exists "Authenticated may insert cell (creator must be current user)" on public.cells;
create policy "Authenticated may insert cell (creator must be current user)"
  on public.cells for insert
  to authenticated
  with check (auth.uid() = creator_id);


-- public.cell_memberships
create table if not exists public.cell_memberships (
  cell_id uuid references public.cells(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role text not null default 'MEMBER' check (role in ('MEMBER','MODERATOR')),
  created_at timestamptz not null default now(),
  primary key (cell_id, user_id)
);

alter table public.cell_memberships enable row level security;

drop policy if exists "Members can select own membership" on public.cell_memberships;
create policy "Members can select own membership" 
  on public.cell_memberships for select 
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own membership" on public.cell_memberships;
create policy "Users can insert their own membership" 
  on public.cell_memberships for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own membership" on public.cell_memberships;
create policy "Users can delete their own membership" 
  on public.cell_memberships for delete
  to authenticated
  using (auth.uid() = user_id);

-- now that memberships table exists, add selection policy for cells
drop policy if exists "Authenticated may select open cells or those they belong to" on public.cells;
create policy "Authenticated may select open cells or those they belong to"
  on public.cells for select
  to authenticated
  using (
    type = 'OPEN' OR
    exists (
      select 1 from public.cell_memberships m
      where m.cell_id = cells.id and m.user_id = auth.uid()
    )
  );

-- allow creator to remove others (later)


-- public.cell_messages
create table if not exists public.cell_messages (
  id uuid primary key default gen_random_uuid(),
  cell_id uuid references public.cells(id) on delete cascade,
  author_id uuid references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.cell_messages enable row level security;

drop policy if exists "Can select message when cell open or user member" on public.cell_messages;
create policy "Can select message when cell open or user member" 
  on public.cell_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.cells c
      where c.id = cell_messages.cell_id
        and (
          c.type = 'OPEN' or
          exists (
            select 1 from public.cell_memberships m
            where m.cell_id = c.id and m.user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "Authors may insert their own messages" on public.cell_messages;
create policy "Authors may insert their own messages" 
  on public.cell_messages for insert
  to authenticated
  with check (auth.uid() = author_id);

-- Enable realtime for cell_messages
alter publication supabase_realtime add table public.cell_messages;
