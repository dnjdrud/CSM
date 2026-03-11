-- user_bookmarks: saved posts per user
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_bookmarks_select" ON public.user_bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_bookmarks_insert" ON public.user_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_bookmarks_delete" ON public.user_bookmarks
  FOR DELETE USING (auth.uid() = user_id);
