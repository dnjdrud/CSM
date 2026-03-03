-- Soft account deletion: deactivated_at on users. Reversible within 7 days.

alter table public.users
  add column if not exists deactivated_at timestamptz null;

create index if not exists idx_users_deactivated_at
  on public.users(deactivated_at)
  where deactivated_at is not null;
