-- Remove view that depended on posts.pinned_at (pin feature removed).
-- Safe if view does not exist.
DROP VIEW IF EXISTS public.debug_posts_summary;
