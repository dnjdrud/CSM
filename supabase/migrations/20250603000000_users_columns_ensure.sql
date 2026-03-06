-- Ensure public.users has deactivated_at, username, church (idempotent).
-- Run if earlier migrations (soft_delete, signup_approval) were skipped or order differs.

alter table public.users
  add column if not exists deactivated_at timestamptz null,
  add column if not exists username text null,
  add column if not exists church text null;

create index if not exists idx_users_deactivated_at
  on public.users(deactivated_at)
  where deactivated_at is not null;

create unique index if not exists idx_users_username_lower
  on public.users(lower(username))
  where username is not null;
