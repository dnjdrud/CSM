-- Fix posts_category_check constraint to include all categories defined in PostCategory type.
-- The existing constraint only allowed a subset; this update adds missing values.

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_category_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_category_check
  CHECK (category IN (
    'GENERAL',
    'DEVOTIONAL',
    'MINISTRY',
    'TESTIMONY',
    'PHOTO',
    'PRAYER',
    'CELL',
    'CONTENT',
    'REQUEST',
    'MISSION'
  ));
