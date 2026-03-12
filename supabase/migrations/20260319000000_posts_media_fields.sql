-- Add youtube_url and media_urls columns to posts for CONTENT and PHOTO post types.
-- Safe to run multiple times (IF NOT EXISTS / column already exists handled by DO block).

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
