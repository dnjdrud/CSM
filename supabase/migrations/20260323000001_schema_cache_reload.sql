-- Ensure denomination column exists (idempotent - safe to re-run)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS denomination text,
  ADD COLUMN IF NOT EXISTS faith_years smallint;

ALTER TABLE public.signup_requests
  ADD COLUMN IF NOT EXISTS denomination text,
  ADD COLUMN IF NOT EXISTS faith_years smallint;

-- Ensure prayer tables exist (idempotent)
CREATE TABLE IF NOT EXISTS public.prayer_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  content      text not null,
  category     text not null default 'PERSONAL',
  visibility   text not null default 'PUBLIC',
  answered_at  timestamptz,
  answer_note  text,
  created_at   timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.prayer_intercessions (
  id                uuid primary key default gen_random_uuid(),
  prayer_request_id uuid not null references public.prayer_requests(id) on delete cascade,
  user_id           uuid not null references public.users(id) on delete cascade,
  message           text,
  created_at        timestamptz not null default now(),
  unique (prayer_request_id, user_id)
);

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
