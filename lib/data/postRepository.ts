// Search functions (searchPosts, listAllTags, listPopularTags, searchTags) have been
// moved to searchRepository.ts. Re-exported here for compatibility.
export * from "./searchRepository";

import type { Post as DomainPost, PostWithAuthor } from "@/lib/domain/types";
import { supabaseServer } from "@/lib/supabase/server";
import {
  POSTS_FEED_SELECT,
  isColumnOrSchemaError,
  isHiddenAtError,
  normalizeTag,
  getAuthorMap,
  getReactionCountsByPostIds,
  placeholderUser,
  rowToPost,
  hydratePostRows,
} from "./_internal/postHelpers";
import type { FeedPostRow } from "./_internal/postHelpers";

let hasHiddenAtColumn: boolean | null = null;

/** Fetch today's Daily Prayer post (has daily-prayer tag, most recent today KST). */
export async function getTodaysDailyPrayer(): Promise<PostWithAuthor | null> {
  const supabase = await supabaseServer();
  const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const startOfDay = `${todayKST}T00:00:00.000Z`;
  const { data: rows } = await supabase
    .from("posts")
    .select(POSTS_FEED_SELECT)
    .contains("tags", ["daily-prayer"])
    .gte("created_at", startOfDay)
    .order("created_at", { ascending: false })
    .limit(1);
  if (!rows?.length) return null;
  const r = rows[0]!;
  const authorMap = await getAuthorMap(supabase, [r.author_id]);
  const author = authorMap.get(r.author_id) ?? placeholderUser(r.author_id);
  return {
    ...rowToPost(r),
    author,
    reactionsByCurrentUser: { prayed: false, withYou: false },
    reactionCounts: { prayed: 0, withYou: 0 },
  } as PostWithAuthor;
}

/** List recent posts by category for Connect/Explore page. */
export async function listPostsByCategory(
  category: string,
  limit = 12
): Promise<PostWithAuthor[]> {
  const supabase = await supabaseServer();
  const { data: rows } = await supabase
    .from("posts")
    .select(POSTS_FEED_SELECT)
    .eq("category", category)
    .in("visibility", ["PUBLIC", "MEMBERS"])
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!rows?.length) return [];
  const authorIds = [...new Set(rows.map((r) => r.author_id))];
  const authorMap = await getAuthorMap(supabase, authorIds);
  return rows.map((r) => ({
    ...rowToPost(r),
    author: authorMap.get(r.author_id) ?? placeholderUser(r.author_id),
    reactionsByCurrentUser: { prayed: false, withYou: false },
    reactionCounts: { prayed: 0, withYou: 0 },
  })) as PostWithAuthor[];
}

export type ListFeedPostsPageParams = {
  currentUserId: string | null;
  scope: "ALL" | "FOLLOWING";
  limit: number;
  cursor?: { createdAt: string; id: string } | null;
  /** Exclude posts with these categories (e.g. ["PRAYER"] for Feed tab). */
  excludeCategories?: string[];
  /** Include ONLY posts with these categories (e.g. ["PRAYER"] for Prayer tab). */
  includeCategories?: string[];
  /** When true, only return posts that have a youtube_url set. */
  requireYoutubeUrl?: boolean;
};

export type ListFeedPostsPageResult = {
  items: PostWithAuthor[];
  nextCursor: { createdAt: string; id: string } | null;
  /** Set when the feed query failed so the UI can show it. */
  error?: string;
};

export async function listFeedPostsPage(
  params: ListFeedPostsPageParams
): Promise<ListFeedPostsPageResult> {
  const supabase = await supabaseServer();
  const uid = params.currentUserId ?? null;
  const limit = Math.min(Math.max(params.limit || 20, 1), 100);

  // Resolve following IDs ONCE before the retry loop.
  let authorIds: string[] | null = null;
  if (params.scope === "FOLLOWING" && uid) {
    const { data: followRows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", uid);
    const followingIds = (followRows ?? []).map((r: { following_id: string }) => r.following_id);
    authorIds = [...new Set([uid, ...followingIds])];
  }

  const useHidden = hasHiddenAtColumn !== false;
  const runQuery = async (selectColumns: string = POSTS_FEED_SELECT) => {
    let q = supabase
      .from("posts")
      .select(selectColumns)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1);
    if (useHidden) q = q.is("hidden_at", null);
    if (authorIds) q = q.in("author_id", authorIds);
    if (uid) {
      if (params.scope === "FOLLOWING") {
        q = q.or(`visibility.in.(PUBLIC,MEMBERS,FOLLOWERS),author_id.eq.${uid}`);
      } else {
        q = q.or(`visibility.in.(PUBLIC,MEMBERS),author_id.eq.${uid}`);
      }
    } else {
      q = q.eq("visibility", "PUBLIC");
    }
    if (params.excludeCategories && params.excludeCategories.length > 0) {
      q = q.not("category", "in", `(${params.excludeCategories.join(",")})`);
    }
    if (params.includeCategories && params.includeCategories.length > 0) {
      q = q.in("category", params.includeCategories);
    }
    if (params.requireYoutubeUrl) {
      q = q.not("youtube_url", "is", null);
    }
    if (params.cursor?.createdAt && params.cursor?.id) {
      const c = params.cursor;
      q = q.or(`created_at.lt.${c.createdAt},and(created_at.eq.${c.createdAt},id.lt.${c.id})`);
    }
    return await q;
  };

  let { data: rows, error } = await runQuery();
  if (error && isHiddenAtError(error.message)) {
    hasHiddenAtColumn = false;
    const next = await runQuery();
    rows = next.data;
    error = next.error;
  }
  if (error && isColumnOrSchemaError(error.message)) {
    const next = await runQuery(POSTS_FEED_SELECT);
    rows = next.data;
    error = next.error;
  }
  if (!error && useHidden) hasHiddenAtColumn = true;
  if (error) {
    console.error("[FEED_QUERY_ERROR]", error.message);
    return { items: [], nextCursor: null, error: error.message };
  }
  if (!rows?.length) return { items: [], nextCursor: null };

  const normalizedRows = (rows ?? []) as unknown as FeedPostRow[];
  const hasMore = normalizedRows.length > limit;
  const pageRows = hasMore ? normalizedRows.slice(0, limit) : normalizedRows;

  const items = await hydratePostRows(supabase, pageRows, uid, { includeCommentCounts: true });

  const nextCursor: { createdAt: string; id: string } | null =
    hasMore && pageRows.length > 0
      ? {
          createdAt: pageRows[pageRows.length - 1].created_at ?? new Date().toISOString(),
          id: pageRows[pageRows.length - 1].id,
        }
      : null;

  return { items, nextCursor };
}

export async function getPostById(id: string): Promise<PostWithAuthor | null> {
  const supabase = await supabaseServer();
  const { data: row, error } = await supabase
    .from("posts")
    .select(POSTS_FEED_SELECT)
    .eq("id", id)
    .single();
  if (error) {
    console.error("[FEED_QUERY_ERROR] getPostById", error.message);
    return null;
  }
  if (!row) return null;
  const currentUserId =
    (await supabase.auth.getSession()).data.session?.user?.id ?? null;
  const [authorMap, reactionCountsMap, { data: reactionRows }] = await Promise.all([
    getAuthorMap(supabase, [row.author_id]),
    getReactionCountsByPostIds(supabase, [id]),
    supabase
      .from("reactions")
      .select("type")
      .eq("post_id", id)
      .eq("user_id", currentUserId ?? ""),
  ]);
  const author = authorMap.get(row.author_id);
  if (!author) return null;
  const reactionsByCurrentUser =
    currentUserId && reactionRows
      ? {
          prayed: reactionRows.some((r) => r.type === "PRAYED"),
          withYou: reactionRows.some((r) => r.type === "WITH_YOU"),
        }
      : { prayed: false, withYou: false };
  const reactionCounts = reactionCountsMap.get(id) ?? { prayed: 0, withYou: 0 };
  return {
    ...rowToPost(row),
    author,
    reactionsByCurrentUser,
    reactionCounts,
  } as PostWithAuthor;
}

export async function createPost(input: {
  authorId: string;
  category: DomainPost["category"];
  content: string;
  visibility?: DomainPost["visibility"];
  tags?: string[];
  youtubeUrl?: string | null;
  mediaUrls?: string[];
  subscribersOnly?: boolean;
  aiSummary?: string | null;
  aiDescription?: string | null;
  aiTags?: string[];
}): Promise<DomainPost> {
  const supabase = await supabaseServer();
  const tags = [...new Set((input.tags ?? []).map(normalizeTag).filter(Boolean))].slice(0, 5);
  const payload: Record<string, unknown> = {
    author_id: input.authorId,
    category: input.category,
    content: input.content.trim(),
    visibility: input.visibility ?? "MEMBERS",
    tags,
    subscribers_only: input.subscribersOnly ?? false,
  };
  if (input.youtubeUrl) payload.youtube_url = input.youtubeUrl;
  if (input.mediaUrls && input.mediaUrls.length > 0) payload.media_urls = input.mediaUrls;
  if (input.aiSummary) { payload.ai_summary = input.aiSummary; payload.has_ai_generated = true; }
  if (input.aiDescription) payload.ai_description = input.aiDescription;
  if (input.aiTags && input.aiTags.length > 0) payload.ai_tags = input.aiTags;
  const result = await supabase.from("posts").insert(payload).select(POSTS_FEED_SELECT).single();
  if (result.error) {
    console.error("[createPost] insert error", result.error.message, payload);
    throw new Error(result.error.message);
  }
  return rowToPost(result.data as Parameters<typeof rowToPost>[0]);
}

export async function updatePost(
  postId: string,
  actorId: string,
  input: {
    content?: string;
    category?: DomainPost["category"];
    visibility?: DomainPost["visibility"];
    tags?: string[];
  }
): Promise<DomainPost | null> {
  const supabase = await supabaseServer();
  const { data: existing } = await supabase
    .from("posts")
    .select("id, author_id")
    .eq("id", postId)
    .single();
  if (!existing || existing.author_id !== actorId) return null;
  const updates: Record<string, unknown> = {};
  if (input.content !== undefined) updates.content = input.content.trim();
  if (input.category !== undefined) updates.category = input.category;
  if (input.visibility !== undefined) updates.visibility = input.visibility;
  if (input.tags !== undefined) {
    updates.tags = [...new Set(input.tags.map(normalizeTag).filter(Boolean))].slice(0, 5);
  }
  if (Object.keys(updates).length === 0) {
    const { data: row } = await supabase
      .from("posts")
      .select(POSTS_FEED_SELECT)
      .eq("id", postId)
      .single();
    return row ? rowToPost(row) : null;
  }
  const { data: row, error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", postId)
    .eq("author_id", actorId)
    .select(POSTS_FEED_SELECT)
    .single();
  if (error || !row) return null;
  return rowToPost(row);
}

export async function deletePost(postId: string, actorId: string): Promise<boolean> {
  const supabase = await supabaseServer();
  const { data: existing } = await supabase
    .from("posts")
    .select("id, author_id")
    .eq("id", postId)
    .single();
  if (!existing || existing.author_id !== actorId) return false;
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  return !error;
}

export async function listPostsByTag(
  normalizedTag: string,
  params?: { currentUserId?: string | null; scope?: "ALL" | "FOLLOWING" }
): Promise<PostWithAuthor[]> {
  const supabase = await supabaseServer();
  let query = supabase
    .from("posts")
    .select(POSTS_FEED_SELECT)
    .contains("tags", [normalizedTag])
    .order("created_at", { ascending: false });
  if (params?.scope === "FOLLOWING" && params?.currentUserId) {
    const { data: followRows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", params.currentUserId);
    const followingIds = (followRows ?? []).map((r) => r.following_id);
    if (followingIds.length === 0) return [];
    query = query.in("author_id", followingIds);
  }
  const { data: rows } = await query;
  if (!rows?.length) return [];
  const uid = params?.currentUserId ?? null;
  return hydratePostRows(supabase, rows as FeedPostRow[], uid);
}

export async function listPostsByAuthorId(authorId: string): Promise<PostWithAuthor[]> {
  const supabase = await supabaseServer();
  const { data: { session: _listSess } } = await supabase.auth.getSession();
  const uid = _listSess?.user?.id ?? null;
  const { data: rows } = await supabase
    .from("posts")
    .select(POSTS_FEED_SELECT)
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });
  if (!rows?.length) return [];
  return hydratePostRows(supabase, rows as FeedPostRow[], uid);
}

export async function listPostsByAuthorIdPaged(params: {
  authorId: string;
  limit: number;
  offset: number;
  category?: string;
  excludeCategory?: string;
}): Promise<{ items: PostWithAuthor[]; hasMore: boolean }> {
  const supabase = await supabaseServer();
  const { data: { session: _sess } } = await supabase.auth.getSession();
  const uid = _sess?.user?.id ?? null;
  const fetchLimit = params.limit + 1;
  let query = supabase
    .from("posts")
    .select(POSTS_FEED_SELECT)
    .eq("author_id", params.authorId)
    .order("created_at", { ascending: false })
    .range(params.offset, params.offset + fetchLimit - 1);
  if (params.category) query = query.eq("category", params.category);
  if (params.excludeCategory) query = query.neq("category", params.excludeCategory);
  const { data: rows } = await query;
  if (!rows?.length) return { items: [], hasMore: false };
  const hasMore = rows.length > params.limit;
  const pageRows = hasMore ? rows.slice(0, params.limit) : rows;
  const items = await hydratePostRows(supabase, pageRows as FeedPostRow[], uid, {
    includeCommentCounts: true,
  });
  return { items, hasMore };
}

export async function getPostCountByAuthor(
  authorId: string,
  opts: { excludeCategory?: string } = {}
): Promise<number> {
  const supabase = await supabaseServer();
  let query = supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", authorId);
  if (opts.excludeCategory) query = query.neq("category", opts.excludeCategory);
  const { count } = await query;
  return count ?? 0;
}

/** Write AI-generated fields back to a post (called by AI worker after enrichment). */
export async function updatePostAiFields(
  postId: string,
  fields: {
    youtubeId?: string;
    aiSummary?: string;
    aiDescription?: string;
    aiTags?: string[];
  }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("posts")
    .update({
      youtube_id: fields.youtubeId ?? null,
      ai_summary: fields.aiSummary ?? null,
      ai_description: fields.aiDescription ?? null,
      ai_tags: fields.aiTags ?? [],
      has_ai_generated: true,
    })
    .eq("id", postId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
