-- Ensure media_urls and youtube_url columns exist on posts table.
-- Idempotent: safe to run even if already applied.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'youtube_url'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN youtube_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN media_urls text[] DEFAULT '{}';
  END IF;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
