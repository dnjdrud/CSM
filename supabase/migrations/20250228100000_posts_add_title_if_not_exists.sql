-- Ensure posts.title exists (some projects created before it was in schema).
-- Safe to run: no-op if column already exists.
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS title text;
