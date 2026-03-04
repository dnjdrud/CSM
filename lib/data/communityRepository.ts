/**
 * Community split-view: feed from public.posts (id, title, content, thumbnail_url, youtube_id, created_at).
 * Uses supabaseServer() for RSC. Excludes hidden posts when column exists.
 */
import { supabaseServer } from "@/lib/supabase/server";

const COMMUNITY_POST_SELECT =
  "id, title, content, thumbnail_url, youtube_id, created_at";

export type CommunityPost = {
  id: string;
  title: string | null;
  content: string | null;
  thumbnail_url: string | null;
  youtube_id: string | null;
  created_at: string;
};

const ROW_LIMIT = 30;

/** List latest posts for community feed. */
export async function listCommunityPosts(): Promise<{
  posts: CommunityPost[];
  error: string | null;
}> {
  try {
    const supabase = await supabaseServer();
    const { data: rows, error } = await supabase
      .from("posts")
      .select(COMMUNITY_POST_SELECT)
      .is("hidden_at", null)
      .order("created_at", { ascending: false })
      .limit(ROW_LIMIT);
    if (error) return { posts: [], error: error.message };
    const posts = (rows ?? []).map((r) => ({
      id: r.id,
      title: r.title ?? null,
      content: r.content ?? null,
      thumbnail_url: r.thumbnail_url ?? null,
      youtube_id: r.youtube_id ?? null,
      created_at: r.created_at ?? new Date().toISOString(),
    }));
    return { posts, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { posts: [], error: msg };
  }
}

/** Get single post by id for content panel. */
export async function getCommunityPost(
  id: string
): Promise<{ post: CommunityPost | null; error: string | null }> {
  try {
    const supabase = await supabaseServer();
    const { data: row, error } = await supabase
      .from("posts")
      .select(COMMUNITY_POST_SELECT)
      .eq("id", id)
      .is("hidden_at", null)
      .maybeSingle();
    if (error) return { post: null, error: error.message };
    if (!row)
      return { post: null, error: null };
    return {
      post: {
        id: row.id,
        title: row.title ?? null,
        content: row.content ?? null,
        thumbnail_url: row.thumbnail_url ?? null,
        youtube_id: row.youtube_id ?? null,
        created_at: row.created_at ?? new Date().toISOString(),
      },
      error: null,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { post: null, error: msg };
  }
}
