/**
 * Internal helpers shared across domain repository modules.
 * NOT part of the public API — import only from sibling repository files.
 */
import type { User, Post as DomainPost, PostWithAuthor, UserRole } from "@/lib/domain/types";
import { supabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const SEARCH_MAX = 30;

/** Feed select: only columns that exist in current DB. */
export const POSTS_FEED_SELECT = "id, author_id, category, content, visibility, tags, created_at, youtube_url, media_urls, youtube_id, ai_summary, ai_description, ai_tags, has_ai_generated" as const;

export function isColumnOrSchemaError(message: string): boolean {
  const m = String(message).toLowerCase();
  return /column.*does not exist|does not exist.*column|schema cache|could not find.*column/i.test(m);
}

export function isHiddenAtError(message: string): boolean {
  return /hidden_at|column.*does not exist.*hidden/i.test(String(message));
}

export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, " ");
}

export function rowToUser(r: {
  id: string;
  name: string | null;
  role: string | null;
  bio: string | null;
  affiliation: string | null;
  created_at: string | null;
  deactivated_at?: string | null;
  denomination?: string | null;
  faith_years?: number | null;
  username?: string | null;
  church?: string | null;
  support_url?: string | null;
  avatar_url?: string | null;
}): User {
  return {
    id: r.id,
    name: r.name ?? "",
    role: (r.role as UserRole) ?? "LAY",
    bio: r.bio ?? undefined,
    affiliation: r.affiliation ?? undefined,
    church: r.church ?? undefined,
    username: r.username ?? undefined,
    createdAt: r.created_at ?? new Date().toISOString(),
    deactivatedAt: r.deactivated_at ?? undefined,
    denomination: r.denomination ?? undefined,
    faithYears: r.faith_years ?? undefined,
    supportUrl: r.support_url ?? undefined,
    avatarUrl: r.avatar_url ?? undefined,
  };
}

export function rowToPost(r: {
  id: string;
  author_id: string;
  category: string;
  content: string;
  visibility: string;
  tags: string[] | null;
  created_at: string | null;
  youtube_url?: string | null;
  media_urls?: string[] | null;
  youtube_id?: string | null;
  ai_summary?: string | null;
  ai_description?: string | null;
  ai_tags?: string[] | null;
  has_ai_generated?: boolean | null;
}): DomainPost {
  return {
    id: r.id,
    authorId: r.author_id,
    category: r.category as DomainPost["category"],
    content: r.content,
    visibility: (r.visibility as DomainPost["visibility"]) ?? "MEMBERS",
    tags: r.tags ?? [],
    reflectionPrompt: undefined,
    createdAt: r.created_at ?? new Date().toISOString(),
    youtubeUrl: r.youtube_url ?? undefined,
    mediaUrls: r.media_urls ?? [],
    youtubeId: r.youtube_id ?? undefined,
    aiSummary: r.ai_summary ?? undefined,
    aiDescription: r.ai_description ?? undefined,
    aiTags: r.ai_tags ?? undefined,
    hasAiGenerated: r.has_ai_generated ?? false,
  };
}

/** Placeholder user when users table select fails (e.g. RLS) so feed still returns posts. */
export function placeholderUser(id: string): User {
  return {
    id,
    name: "Unknown",
    role: "LAY",
    createdAt: new Date().toISOString(),
  };
}

/**
 * Resolve user rows by id for author display. Uses admin client when available so that
 * RLS does not hide other users — otherwise viewers would see "Unknown" for post authors.
 */
export async function getAuthorMap(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  ids: string[]
): Promise<Map<string, User>> {
  if (ids.length === 0) return new Map();
  const client = getSupabaseAdmin() ?? supabase;
  try {
    const { data, error } = await client
      .from("users")
      .select("id, name, role, bio, affiliation, created_at, deactivated_at, avatar_url")
      .in("id", ids);
    if (error) {
      console.warn("[getAuthorMap] users select failed:", error.message);
      return new Map(ids.map((id) => [id, placeholderUser(id)]));
    }
    const map = new Map<string, User>();
    (data ?? []).forEach((r) => map.set(r.id, rowToUser(r)));
    ids.forEach((id) => {
      if (!map.has(id)) map.set(id, placeholderUser(id));
    });
    return map;
  } catch (e) {
    console.warn("[getAuthorMap] error:", e);
    return new Map(ids.map((id) => [id, placeholderUser(id)]));
  }
}

export async function getCommentCountsByPostIds(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  postIds: string[]
): Promise<Map<string, number>> {
  if (postIds.length === 0) return new Map();
  const map = new Map<string, number>(postIds.map((id) => [id, 0]));
  const { data } = await supabase.rpc("get_comment_counts", { post_ids: postIds });
  (data ?? []).forEach((r: { post_id: string; count: number }) => {
    map.set(r.post_id, Number(r.count));
  });
  return map;
}

export async function getReactionCountsByPostIds(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  postIds: string[]
): Promise<Map<string, { prayed: number; withYou: number }>> {
  if (postIds.length === 0) return new Map();
  const map = new Map<string, { prayed: number; withYou: number }>(
    postIds.map((id) => [id, { prayed: 0, withYou: 0 }])
  );
  const { data } = await supabase.rpc("get_reaction_counts", { post_ids: postIds });
  (data ?? []).forEach((r: { post_id: string; type: string; count: number }) => {
    const cur = map.get(r.post_id);
    if (!cur) return;
    if (r.type === "PRAYED") cur.prayed = Number(r.count);
    else if (r.type === "WITH_YOU") cur.withYou = Number(r.count);
  });
  return map;
}

/** Shared row shape for posts selected with POSTS_FEED_SELECT. */
export type FeedPostRow = {
  id: string;
  author_id: string;
  category: string;
  content: string;
  visibility: string;
  tags: string[] | null;
  created_at: string | null;
  youtube_url?: string | null;
  media_urls?: string[] | null;
};

/**
 * Shared post hydration: resolves authors, reaction counts, and optionally comment counts
 * for a batch of post rows.
 * Key optimization: reactionsByCurrentUser is built in O(m) with a single Set pass.
 */
export async function hydratePostRows(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  rows: FeedPostRow[],
  currentUserId: string | null,
  opts: { includeCommentCounts?: boolean } = {}
): Promise<PostWithAuthor[]> {
  if (rows.length === 0) return [];
  const authorIds = [...new Set(rows.map((r) => r.author_id))];
  const postIds = rows.map((r) => r.id);

  const [authorMap, reactionCountsMap, commentCountsMap, { data: reactionRows }] =
    await Promise.all([
      getAuthorMap(supabase, authorIds),
      getReactionCountsByPostIds(supabase, postIds),
      opts.includeCommentCounts
        ? getCommentCountsByPostIds(supabase, postIds)
        : Promise.resolve(new Map<string, number>()),
      currentUserId
        ? supabase
            .from("reactions")
            .select("post_id, type")
            .in("post_id", postIds)
            .eq("user_id", currentUserId)
        : { data: [] as { post_id: string; type: string }[] },
    ]);

  const prayedPosts = new Set<string>();
  const withYouPosts = new Set<string>();
  (reactionRows ?? []).forEach((r: { post_id: string; type: string }) => {
    if (r.type === "PRAYED") prayedPosts.add(r.post_id);
    else if (r.type === "WITH_YOU") withYouPosts.add(r.post_id);
  });

  return rows.map((r) => ({
    ...rowToPost(r),
    author: authorMap.get(r.author_id) ?? placeholderUser(r.author_id),
    reactionsByCurrentUser: { prayed: prayedPosts.has(r.id), withYou: withYouPosts.has(r.id) },
    reactionCounts: reactionCountsMap.get(r.id) ?? { prayed: 0, withYou: 0 },
    ...(opts.includeCommentCounts ? { commentCount: commentCountsMap.get(r.id) ?? 0 } : {}),
  })) as PostWithAuthor[];
}
