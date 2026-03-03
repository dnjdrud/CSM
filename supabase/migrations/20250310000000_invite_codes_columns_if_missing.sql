-- Ensure invite_codes has all columns needed for admin create/list. Safe to run multiple times.
alter table public.invite_codes
  add column if not exists expires_at timestamptz,
  add column if not exists max_uses int not null default 1,
  add column if not exists uses_count int not null default 0,
  add column if not exists note text,
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_by uuid references public.users(id) on delete set null,
  add column if not exists used_email text;
