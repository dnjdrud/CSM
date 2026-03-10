-- Cell invite tokens for private cells

create table if not exists public.cell_invites (
  id uuid primary key default gen_random_uuid(),
  cell_id uuid not null references public.cells(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(18), 'base64'),
  created_by uuid not null references public.users(id) on delete cascade,
  used_by uuid references public.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

alter table public.cell_invites enable row level security;

-- Moderator/creator of the cell can create invites
drop policy if exists "Cell moderator may insert invite" on public.cell_invites;
create policy "Cell moderator may insert invite"
  on public.cell_invites for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.cells c
      where c.id = cell_invites.cell_id
        and (
          c.creator_id = auth.uid()
          or exists (
            select 1 from public.cell_memberships m
            where m.cell_id = c.id and m.user_id = auth.uid() and m.role = 'MODERATOR'
          )
        )
    )
  );

-- Anyone authenticated can read an invite by token (for join flow)
-- Row-level: expose only by token lookup (handled via service role in API)
-- No public SELECT policy – token validation is done server-side with admin client.

-- Creator can view own invites
drop policy if exists "Creator can view own invites" on public.cell_invites;
create policy "Creator can view own invites"
  on public.cell_invites for select
  to authenticated
  using (auth.uid() = created_by);
