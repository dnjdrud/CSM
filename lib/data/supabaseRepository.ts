/**
 * Supabase-backed repository. Uses supabaseServer() for RSC-compatible reads and writes.
 * Requires tables: posts, comments, follows, reactions, notifications (users exists).
 *
 * Schema (run in Supabase SQL):
 * - posts: id uuid primary key default gen_random_uuid(), author_id uuid references auth.users(id), category text,
 *   content text, visibility text default 'MEMBERS', tags text[] default '{}',
 *   created_at timestamptz default now()
 * - comments: id uuid primary key default gen_random_uuid(), post_id uuid references posts(id) on delete cascade,
 *   author_id uuid references auth.users(id), content text, parent_id uuid references comments(id), created_at timestamptz default now()
 * - follows: follower_id uuid, following_id uuid, created_at timestamptz default now(), primary key (follower_id, following_id)
 * - reactions: id uuid primary key default gen_random_uuid(), post_id uuid references posts(id) on delete cascade,
 *   user_id uuid references auth.users(id), type text, created_at timestamptz default now(), unique(post_id, user_id, type)
 * - notifications: id uuid primary key default gen_random_uuid(), type text, recipient_id uuid, actor_id uuid, post_id uuid, read_at timestamptz, created_at timestamptz default now()
 * RLS: enable on all; policies for visibility (posts), recipient_id = auth.uid() (notifications), actor_id = auth.uid() on insert (notifications).
 * For posts: ensure SELECT is allowed for authenticated users (e.g. allow read where visibility in ('MEMBERS','PUBLIC') or author_id = auth.uid()), otherwise feed will be empty.
 */
import type {
  User,
  Post as DomainPost,
  PostWithAuthor,
  Comment,
  ReactionType,
  UserRole,
  Notification,
  NotificationType,
  Note,
  NoteType,
  Cell,
  CellMessage,
  Ministry,
  SupportIntent,
  SupportTransaction,
  SupportPurpose,
  DirectMessage,
  ConversationPreview,
  PrayerRequest,
  PrayerCategory,
  PrayerIntercession,
  NotificationPrefs,
  MissionaryProject,
  MissionaryProjectStatus,
  MissionaryReport,
  MissionarySupporter,
  SupportType,
  TheologyQuestion,
  TheologyCategory,
  TheologyAnswer,
} from "@/lib/domain/types";
// DEFAULT_NOTIFICATION_PREFS used as value (not just type)
import { DEFAULT_NOTIFICATION_PREFS } from "@/lib/domain/types";
import { supabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { tokenize, sortByScore } from "@/lib/search";

const SEARCH_MAX = 30;

/** Feed select: only columns that exist in current DB. */
const POSTS_FEED_SELECT = "id, author_id, category, content, visibility, tags, created_at" as const;

function isColumnOrSchemaError(message: string): boolean {
  const m = String(message).toLowerCase();
  return /column.*does not exist|does not exist.*column|schema cache|could not find.*column/i.test(m);
}

let hasHiddenAtColumn: boolean | null = null;

function isHiddenAtError(message: string): boolean {
  return /hidden_at|column.*does not exist.*hidden/i.test(String(message));
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, " ");
}

function rowToUser(r: { id: string; name: string | null; role: string | null; bio: string | null; affiliation: string | null; created_at: string | null; deactivated_at?: string | null; denomination?: string | null; faith_years?: number | null; username?: string | null; church?: string | null; support_url?: string | null; avatar_url?: string | null }): User {
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

function rowToPost(r: {
  id: string;
  author_id: string;
  category: string;
  content: string;
  visibility: string;
  tags: string[] | null;
  created_at: string | null;
  youtube_url?: string | null;
  media_urls?: string[] | null;
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
  };
}

// -- cell helpers -------------------------------------------------------------
function rowToCell(r: {
  id: string;
  type: string;
  title: string;
  creator_id: string;
  topic_tags: string[] | null;
  created_at: string | null;
  cell_memberships?: { count: number }[] | null;
}): Cell {
  return {
    id: r.id,
    type: r.type as Cell["type"],
    title: r.title,
    creatorId: r.creator_id,
    topicTags: r.topic_tags ?? [],
    createdAt: r.created_at ?? new Date().toISOString(),
    memberCount: r.cell_memberships?.[0]?.count,
  };
}

function rowToCellMessage(r: {
  id: string;
  cell_id: string;
  author_id: string;
  content: string;
  created_at: string | null;
  users?: { name: string } | null;
}): CellMessage {
  return {
    id: r.id,
    cellId: r.cell_id,
    authorId: r.author_id,
    authorName: r.users?.name ?? "Unknown",
    content: r.content,
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}

export async function listOpenCells(): Promise<Cell[]> {
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase
      .from("cells")
      .select("*, cell_memberships(count)")
      .eq("type", "OPEN")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[listOpenCells]", error.message);
      return [];
    }
    return (data ?? []).map(rowToCell);
  } catch (e) {
    console.error("[listOpenCells] caught error:", e);
    return [];
  }
}

export async function createCell(input: {
  creatorId: string;
  type: Cell["type"];
  title: string;
  topicTags?: string[];
}): Promise<Cell> {
  const supabase = await supabaseServer();
  const payload = {
    creator_id: input.creatorId,
    type: input.type,
    title: input.title.trim(),
    topic_tags: input.topicTags ?? [],
  };
  const { data, error } = await supabase.from("cells").insert(payload).select("*").single();
  if (error) {
    console.error("[createCell]", error.message, payload);
    throw new Error(error.message);
  }
  return rowToCell(data as any);
}

export async function joinCell(cellId: string, userId: string): Promise<void> {
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("cell_memberships")
    .insert({ cell_id: cellId, user_id: userId });
  if (error && !error.message.includes("duplicate")) {
    console.error("[joinCell]", error.message);
    throw new Error(error.message);
  }
}

export async function leaveCell(cellId: string, userId: string): Promise<void> {
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("cell_memberships")
    .delete()
    .match({ cell_id: cellId, user_id: userId });
  if (error) {
    console.error("[leaveCell]", error.message);
    throw new Error(error.message);
  }
}

export async function getCellMessages(cellId: string, limit = 50): Promise<CellMessage[]> {
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase
      .from("cell_messages")
      .select("*, users(name)")
      .eq("cell_id", cellId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("[getCellMessages]", error.message);
      return [];
    }
    return (data ?? []).map(rowToCellMessage).reverse();
  } catch (e) {
    console.error("[getCellMessages] caught error:", e);
    return [];
  }
}

export async function postCellMessage(cellId: string, authorId: string, content: string): Promise<CellMessage> {
  const supabase = await supabaseServer();
  const payload = { cell_id: cellId, author_id: authorId, content: content.trim() };
  const { data, error } = await supabase
    .from("cell_messages")
    .insert(payload)
    .select("*")
    .single();
  if (error) {
    console.error("[postCellMessage]", error.message, payload);
    throw new Error(error.message);
  }
  return rowToCellMessage(data as any);
}

export async function getCellById(cellId: string): Promise<Cell | null> {
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.from("cells").select("*").eq("id", cellId).single();
    if (error || !data) {
      if (error) console.error("[getCellById]", error.message);
      return null;
    }
    return rowToCell(data as any);
  } catch (e) {
    console.error("[getCellById] caught error:", e);
    return null;
  }
}

export async function isMember(cellId: string, userId: string): Promise<boolean> {
  try {
    const supabase = await supabaseServer();
    // open cells are effectively public
    const { data: cell } = await supabase.from("cells").select("type").eq("id", cellId).single();
    if (cell?.type === "OPEN") return true;
    const { data: rows, error } = await supabase
      .from("cell_memberships")
      .select("user_id")
      .eq("cell_id", cellId)
      .eq("user_id", userId)
      .limit(1);
    if (error) {
      console.error("[isMember]", error.message);
      return false;
    }
    return (rows?.length ?? 0) > 0;
  } catch (e) {
    console.error("[isMember] caught error:", e);
    return false;
  }
}

/** Placeholder user when users table select fails (e.g. RLS) so feed still returns posts. */
function placeholderUser(id: string): User {
  return {
    id,
    name: "Unknown",
    role: "LAY",
    createdAt: new Date().toISOString(),
  };
}

/**
 * Resolve user rows by id for author display. Uses admin client when available so that
 * RLS (users_select_own_or_admin) does not hide other users — otherwise viewers would see "Unknown" for post authors.
 */
async function getAuthorMap(supabase: Awaited<ReturnType<typeof supabaseServer>>, ids: string[]): Promise<Map<string, User>> {
  if (ids.length === 0) return new Map();
  const client = getSupabaseAdmin() ?? supabase;
  try {
    const { data, error } = await client.from("users").select("id, name, role, bio, affiliation, created_at, deactivated_at, avatar_url").in("id", ids);
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

/** Fetch comment counts per post in one query. Returns map postId -> count. */
async function getCommentCountsByPostIds(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  postIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  postIds.forEach((id) => map.set(id, 0));
  if (postIds.length === 0) return map;
  const { data: rows } = await supabase
    .from("comments")
    .select("post_id")
    .in("post_id", postIds);
  (rows ?? []).forEach((r: { post_id: string }) => {
    map.set(r.post_id, (map.get(r.post_id) ?? 0) + 1);
  });
  return map;
}

/** Fetch reaction counts per post in one query. Returns map postId -> { prayed, withYou }. */
async function getReactionCountsByPostIds(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  postIds: string[]
): Promise<Map<string, { prayed: number; withYou: number }>> {
  const map = new Map<string, { prayed: number; withYou: number }>();
  postIds.forEach((id) => map.set(id, { prayed: 0, withYou: 0 }));
  if (postIds.length === 0) return map;
  const { data: rows } = await supabase
    .from("reactions")
    .select("post_id, type")
    .in("post_id", postIds);
  (rows ?? []).forEach((r: { post_id: string; type: string }) => {
    const cur = map.get(r.post_id);
    if (!cur) return;
    if (r.type === "PRAYED") cur.prayed += 1;
    else if (r.type === "WITH_YOU") cur.withYou += 1;
  });
  return map;
}

export async function listFeedPosts(options: {
  scope: "ALL" | "FOLLOWING";
  currentUserId?: string | null;
}): Promise<PostWithAuthor[]> {
  const supabase = await supabaseServer();
  const uid = options.currentUserId ?? null;
  const useHidden = hasHiddenAtColumn !== false;

  let authorIdsForFollowing: string[] | null = null;
  if (options.scope === "FOLLOWING" && uid) {
    const { data: followRows } = await supabase.from("follows").select("following_id").eq("follower_id", uid);
    const followingIds = (followRows ?? []).map((r) => r.following_id);
    authorIdsForFollowing = [...new Set([uid, ...followingIds])];
  }

  type FeedRow = { id: string; author_id: string; category: string; content: string; visibility: string; tags: string[] | null; created_at: string | null };
  let rows: FeedRow[] | null = null;
  let error: { message: string } | null = null;

  let query = supabase.from("posts").select(POSTS_FEED_SELECT).order("created_at", { ascending: false });
  if (useHidden) query = query.is("hidden_at", null);
  if (authorIdsForFollowing) query = query.in("author_id", authorIdsForFollowing);
  const first = await query;
  rows = first.data as FeedRow[] | null;
  error = first.error;

  if (error && isHiddenAtError(error.message)) {
    hasHiddenAtColumn = false;
    let q2 = supabase.from("posts").select(POSTS_FEED_SELECT).order("created_at", { ascending: false });
    if (authorIdsForFollowing) q2 = q2.in("author_id", authorIdsForFollowing);
    const next = await q2;
    rows = next.data as FeedRow[] | null;
    error = next.error;
  }
  if (error && isColumnOrSchemaError(error.message)) {
    let q3 = supabase.from("posts").select(POSTS_FEED_SELECT).order("created_at", { ascending: false });
    if (authorIdsForFollowing) q3 = q3.in("author_id", authorIdsForFollowing);
    const next = await q3;
    rows = next.data as FeedRow[] | null;
    error = next.error;
  }
  if (!error && useHidden) hasHiddenAtColumn = true;
  if (error) {
    console.error("[FEED_QUERY_ERROR]", error.message);
    return [];
  }
  if (!rows?.length) return [];
  const authorIds = [...new Set(rows.map((r) => r.author_id))];
  const postIds = rows.map((r) => r.id);
  const [authorMap, reactionCountsMap, { data: reactionRows }] = await Promise.all([
    getAuthorMap(supabase, authorIds),
    getReactionCountsByPostIds(supabase, postIds),
    uid ? supabase.from("reactions").select("post_id, user_id, type").in("post_id", postIds).eq("user_id", uid) : { data: [] },
  ]);
  const reactionsByPost = new Map<string, { prayed: boolean; withYou: boolean }>();
  rows.forEach((p) => {
    const userReactions = uid && reactionRows ? reactionRows.filter((r) => r.post_id === p.id && r.user_id === uid) : [];
    reactionsByPost.set(p.id, {
      prayed: userReactions.some((r) => r.type === "PRAYED"),
      withYou: userReactions.some((r) => r.type === "WITH_YOU"),
    });
  });
  return rows.map((r) => {
    const post = rowToPost(r);
    const author = authorMap.get(r.author_id) ?? placeholderUser(r.author_id);
    return {
      ...post,
      author,
      reactionsByCurrentUser: reactionsByPost.get(r.id) ?? { prayed: false, withYou: false },
      reactionCounts: reactionCountsMap.get(r.id) ?? { prayed: 0, withYou: 0 },
    } as PostWithAuthor;
  });
}

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
};

export type ListFeedPostsPageResult = {
  items: PostWithAuthor[];
  nextCursor: { createdAt: string; id: string } | null;
  /** Set when the feed query failed so the UI can show it. */
  error?: string;
};

export async function listFeedPostsPage(params: ListFeedPostsPageParams): Promise<ListFeedPostsPageResult> {
  const supabase = await supabaseServer();
  const uid = params.currentUserId ?? null;
  const limit = Math.min(Math.max(params.limit || 20, 1), 100);

  const useHidden = hasHiddenAtColumn !== false;
  const runQuery = async (selectColumns: string = POSTS_FEED_SELECT) => {
    let q = supabase
      .from("posts")
      .select(selectColumns)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1);
    if (useHidden) q = q.is("hidden_at", null);
    if (params.scope === "FOLLOWING" && uid) {
      const { data: followRows } = await supabase.from("follows").select("following_id").eq("follower_id", uid);
      const followingIds = (followRows ?? []).map((r) => r.following_id);
      const authorIds = [...new Set([uid, ...followingIds])];
      q = q.in("author_id", authorIds);
    }
    if (params.excludeCategories && params.excludeCategories.length > 0) {
      q = q.not("category", "in", `(${params.excludeCategories.join(",")})`);
    }
    if (params.includeCategories && params.includeCategories.length > 0) {
      q = q.in("category", params.includeCategories);
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

  type FeedPostRow = { id: string; author_id: string; category: string; content: string; visibility: string; tags: string[] | null; created_at: string | null };
  const normalizedRows: FeedPostRow[] = (rows ?? []) as unknown as FeedPostRow[];
  const hasMore = normalizedRows.length > limit;
  const pageRows = hasMore ? normalizedRows.slice(0, limit) : normalizedRows;
  const authorIds = [...new Set(pageRows.map((r) => r.author_id))];
  const postIds = pageRows.map((r) => r.id);
  const [authorMap, reactionCountsMap, commentCountsMap, { data: reactionRows }] = await Promise.all([
    getAuthorMap(supabase, authorIds),
    getReactionCountsByPostIds(supabase, postIds),
    getCommentCountsByPostIds(supabase, postIds),
    uid ? supabase.from("reactions").select("post_id, user_id, type").in("post_id", postIds).eq("user_id", uid) : { data: [] },
  ]);
  const reactionsByPost = new Map<string, { prayed: boolean; withYou: boolean }>();
  pageRows.forEach((p) => {
    const userReactions = uid && reactionRows ? reactionRows.filter((r) => r.post_id === p.id && r.user_id === uid) : [];
    reactionsByPost.set(p.id, {
      prayed: userReactions.some((r) => r.type === "PRAYED"),
      withYou: userReactions.some((r) => r.type === "WITH_YOU"),
    });
  });
  const items = pageRows.map((r) => {
    const post = rowToPost(r);
    const author = authorMap.get(r.author_id) ?? placeholderUser(r.author_id);
    return {
      ...post,
      author,
      reactionsByCurrentUser: reactionsByPost.get(r.id) ?? { prayed: false, withYou: false },
      reactionCounts: reactionCountsMap.get(r.id) ?? { prayed: 0, withYou: 0 },
      commentCount: commentCountsMap.get(r.id) ?? 0,
    } as PostWithAuthor;
  });

  const nextCursor: { createdAt: string; id: string } | null =
    hasMore && pageRows.length > 0
      ? {
          createdAt: pageRows[pageRows.length - 1].created_at ?? new Date().toISOString(),
          id: pageRows[pageRows.length - 1].id,
        }
      : null;

  return { items, nextCursor };
}

const POSTS_SINGLE_SELECT = POSTS_FEED_SELECT;

export async function getPostById(id: string): Promise<PostWithAuthor | null> {
  const supabase = await supabaseServer();
  const { data: row, error } = await supabase.from("posts").select(POSTS_SINGLE_SELECT).eq("id", id).single();
  if (error) {
    console.error("[FEED_QUERY_ERROR] getPostById", error.message);
    return null;
  }
  if (!row) return null;
  const currentUserId = (await supabase.auth.getSession()).data.session?.user?.id ?? null;
  const [authorMap, reactionCountsMap, { data: reactionRows }] = await Promise.all([
    getAuthorMap(supabase, [row.author_id]),
    getReactionCountsByPostIds(supabase, [id]),
    supabase.from("reactions").select("type").eq("post_id", id).eq("user_id", currentUserId ?? ""),
  ]);
  const author = authorMap.get(row.author_id);
  if (!author) return null;
  const reactionsByCurrentUser = currentUserId && reactionRows
    ? { prayed: reactionRows.some((r) => r.type === "PRAYED"), withYou: reactionRows.some((r) => r.type === "WITH_YOU") }
    : { prayed: false, withYou: false };
  const reactionCounts = reactionCountsMap.get(id) ?? { prayed: 0, withYou: 0 };
  return {
    ...rowToPost(row),
    author,
    reactionsByCurrentUser,
    reactionCounts,
  } as PostWithAuthor;
}

const POSTS_INSERT_SELECT = "id, author_id, category, content, visibility, tags, created_at, youtube_url, media_urls" as const;

export async function createPost(input: {
  authorId: string;
  category: DomainPost["category"];
  content: string;
  visibility?: DomainPost["visibility"];
  tags?: string[];
  youtubeUrl?: string | null;
  mediaUrls?: string[];
}): Promise<DomainPost> {
  const supabase = await supabaseServer();
  const tags = [...new Set((input.tags ?? []).map(normalizeTag).filter(Boolean))].slice(0, 5);
  const payload: Record<string, unknown> = {
    author_id: input.authorId,
    category: input.category,
    content: input.content.trim(),
    visibility: input.visibility ?? "MEMBERS",
    tags,
  };
  if (input.youtubeUrl) payload.youtube_url = input.youtubeUrl;
  if (input.mediaUrls && input.mediaUrls.length > 0) payload.media_urls = input.mediaUrls;
  const result = await supabase.from("posts").insert(payload).select(POSTS_INSERT_SELECT).single();
  if (result.error) {
    console.error("[createPost] insert error", result.error.message, payload);
    throw new Error(result.error.message);
  }
  const row = result.data;
  return rowToPost(row as Parameters<typeof rowToPost>[0]);
}

export async function updatePost(
  postId: string,
  actorId: string,
  input: { content?: string; category?: DomainPost["category"]; visibility?: DomainPost["visibility"]; tags?: string[] }
): Promise<DomainPost | null> {
  const supabase = await supabaseServer();
  const { data: existing } = await supabase.from("posts").select("id, author_id").eq("id", postId).single();
  if (!existing || existing.author_id !== actorId) return null;
  const updates: Record<string, unknown> = {};
  if (input.content !== undefined) updates.content = input.content.trim();
  if (input.category !== undefined) updates.category = input.category;
  if (input.visibility !== undefined) updates.visibility = input.visibility;
  if (input.tags !== undefined) {
    updates.tags = [...new Set(input.tags.map(normalizeTag).filter(Boolean))].slice(0, 5);
  }
  if (Object.keys(updates).length === 0) {
    const { data: row } = await supabase.from("posts").select(POSTS_FEED_SELECT).eq("id", postId).single();
    return row ? rowToPost(row) : null;
  }
  const { data: row, error } = await supabase.from("posts").update(updates).eq("id", postId).eq("author_id", actorId).select(POSTS_FEED_SELECT).single();
  if (error || !row) return null;
  return rowToPost(row);
}

export async function deletePost(postId: string, actorId: string): Promise<boolean> {
  const supabase = await supabaseServer();
  const { data: existing } = await supabase.from("posts").select("id, author_id").eq("id", postId).single();
  if (!existing || existing.author_id !== actorId) return false;
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  return !error;
}

export async function listCommentsByPostId(postId: string): Promise<(Comment & { author: User })[]> {
  const supabase = await supabaseServer();
  const { data: rows, error } = await supabase
    .from("comments")
    .select("id, post_id, author_id, content, parent_id, created_at")
    .eq("post_id", postId)
    .order("parent_id", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });
  if (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[listCommentsByPostId]", postId, error.message);
    return [];
  }
  if (!rows?.length) return [];
  const authorIds = [...new Set(rows.map((r) => r.author_id))];
  const authorMap = await getAuthorMap(supabase, authorIds);
  const sorted = [...rows].sort((a, b) => {
    const aRoot = a.parent_id ? 1 : 0;
    const bRoot = b.parent_id ? 1 : 0;
    if (aRoot !== bRoot) return aRoot - bRoot;
    return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
  });
  return sorted
    .map((r) => {
      const author = authorMap.get(r.author_id);
      if (!author) return null;
      return {
        id: r.id,
        postId: r.post_id,
        authorId: r.author_id,
        content: r.content,
        createdAt: r.created_at ?? new Date().toISOString(),
        parentId: r.parent_id ?? undefined,
        author,
      } as Comment & { author: User };
    })
    .filter((x): x is Comment & { author: User } => x != null);
}

export async function getCommentById(commentId: string): Promise<(Comment & { author: User }) | null> {
  const supabase = await supabaseServer();
  const { data: r, error } = await supabase
    .from("comments")
    .select("id, post_id, author_id, content, parent_id, created_at")
    .eq("id", commentId)
    .single();
  if (error || !r) return null;
  const authorMap = await getAuthorMap(supabase, [r.author_id]);
  const author = authorMap.get(r.author_id);
  if (!author) return null;
  return {
    id: r.id,
    postId: r.post_id,
    authorId: r.author_id,
    content: r.content,
    createdAt: r.created_at ?? new Date().toISOString(),
    parentId: r.parent_id ?? undefined,
    author,
  } as Comment & { author: User };
}

export async function addComment(input: {
  postId: string;
  authorId: string;
  content: string;
  parentId?: string;
}): Promise<Comment> {
  const supabase = await supabaseServer();
  let parentId: string | undefined;
  if (input.parentId) {
    const { data: parent } = await supabase
      .from("comments")
      .select("id, parent_id")
      .eq("id", input.parentId)
      .eq("post_id", input.postId)
      .single();
    if (parent && !parent.parent_id) parentId = parent.id;
  }
  const payload = {
    post_id: input.postId,
    author_id: input.authorId,
    content: input.content.trim(),
    parent_id: parentId ?? null,
  };
  const { data: row, error } = await supabase
    .from("comments")
    .insert(payload)
    .select("id, post_id, author_id, content, parent_id, created_at")
    .single();
  if (error) {
    // Surface exact Supabase error and payload for debugging (RLS, schema, etc.)
    console.error("[addComment] supabase error", error.message, "payload", payload);
    throw new Error(error.message);
  }
  const postRow = await supabase.from("posts").select("author_id").eq("id", input.postId).single();
  if (postRow.data && postRow.data.author_id !== input.authorId) {
    const { notifyCommented } = await import("@/lib/notifications/events");
    await notifyCommented({
      recipientId: postRow.data.author_id,
      actorId: input.authorId,
      postId: input.postId,
    });
  }
  // Reply: notify the parent comment's author (if different from actor and post author)
  if (parentId) {
    const { data: parentComment } = await supabase
      .from("comments")
      .select("author_id")
      .eq("id", parentId)
      .single();
    const parentAuthorId = parentComment?.author_id;
    const postAuthorId = postRow.data?.author_id;
    if (parentAuthorId && parentAuthorId !== input.authorId && parentAuthorId !== postAuthorId) {
      const { notifyReplied } = await import("@/lib/notifications/events");
      await notifyReplied({
        recipientId: parentAuthorId,
        actorId: input.authorId,
        postId: input.postId,
      });
    }
  }
  // @mention: notify matched users (max 5, skip actor and post author)
  const mentionTokens = (input.content.match(/@(\S+)/g) ?? []).map((t) => t.slice(1)).slice(0, 5);
  if (mentionTokens.length > 0) {
    const { data: mentioned } = await supabase
      .from("users")
      .select("id")
      .in("name", mentionTokens)
      .neq("id", input.authorId)
      .limit(5);
    const postAuthorId = postRow.data?.author_id;
    const toNotify = (mentioned ?? []).filter((u) => u.id !== postAuthorId);
    if (toNotify.length > 0) {
      const { notifyMentioned } = await import("@/lib/notifications/events");
      await Promise.all(
        toNotify.map((u) =>
          notifyMentioned({ recipientId: u.id, actorId: input.authorId, postId: input.postId })
        )
      );
    }
  }
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    content: row.content,
    createdAt: row.created_at ?? new Date().toISOString(),
    parentId: row.parent_id ?? undefined,
  };
}

export async function deleteComment(commentId: string, actorId: string): Promise<boolean> {
  const supabase = await supabaseServer();
  const { data: comment } = await supabase.from("comments").select("author_id").eq("id", commentId).single();
  if (!comment || comment.author_id !== actorId) return false;
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  return !error;
}

export async function updateComment(commentId: string, actorId: string, content: string): Promise<Comment | null> {
  const supabase = await supabaseServer();
  const { data: comment } = await supabase.from("comments").select("author_id").eq("id", commentId).single();
  if (!comment || comment.author_id !== actorId) return null;
  const trimmed = content.trim();
  if (!trimmed) return null;
  const { data: row, error } = await supabase.from("comments").update({ content: trimmed }).eq("id", commentId).eq("author_id", actorId).select("id, post_id, author_id, content, parent_id, created_at").single();
  if (error || !row) return null;
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    content: row.content,
    createdAt: row.created_at ?? new Date().toISOString(),
    parentId: row.parent_id ?? undefined,
  };
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("follows").select("follower_id").eq("follower_id", followerId).eq("following_id", followingId).maybeSingle();
  return !!data;
}

export async function listFollowingIds(userId: string): Promise<string[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
  return (data ?? []).map((r) => r.following_id);
}

export async function listFollowingWithNames(
  userId: string
): Promise<{ id: string; name: string }[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("follows")
    .select("users!follows_following_id_fkey(id, name)")
    .eq("follower_id", userId);
  return (data ?? [])
    .map((r: any) => r.users)
    .filter(Boolean) as { id: string; name: string }[];
}

export async function listFollowerIds(userId: string): Promise<string[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("follows").select("follower_id").eq("following_id", userId);
  return (data ?? []).map((r) => r.follower_id);
}

export async function listFollowers(userId: string): Promise<User[]> {
  const supabase = await supabaseServer();
  const { data: followRows } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", userId);
  if (!followRows?.length) return [];
  const ids = followRows.map((r) => r.follower_id);
  const authorMap = await getAuthorMap(supabase, ids);
  return ids.map((id) => authorMap.get(id)).filter((u): u is User => u != null);
}

export async function listFollowing(userId: string): Promise<User[]> {
  const supabase = await supabaseServer();
  const { data: followRows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);
  if (!followRows?.length) return [];
  const ids = followRows.map((r) => r.following_id);
  const authorMap = await getAuthorMap(supabase, ids);
  return ids.map((id) => authorMap.get(id)).filter((u): u is User => u != null);
}

export async function toggleFollow(followerId: string, followingId: string): Promise<boolean> {
  const supabase = await supabaseServer();
  const { data: existing } = await supabase.from("follows").select("follower_id").eq("follower_id", followerId).eq("following_id", followingId).maybeSingle();
  if (existing) {
    await supabase.from("follows").delete().eq("follower_id", followerId).eq("following_id", followingId);
    return false;
  }
  await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
  const { notifyFollowed } = await import("@/lib/notifications/events");
  await notifyFollowed({ recipientId: followingId, actorId: followerId });
  return true;
}

export async function toggleReaction(postId: string, userId: string, type: ReactionType): Promise<{ reacted: boolean }> {
  const supabase = await supabaseServer();
  const { data: existing } = await supabase.from("reactions").select("id").eq("post_id", postId).eq("user_id", userId).eq("type", type).maybeSingle();
  if (existing) {
    await supabase.from("reactions").delete().eq("id", existing.id);
    return { reacted: false };
  }
  await supabase.from("reactions").insert({ post_id: postId, user_id: userId, type });
  const { data: post } = await supabase.from("posts").select("author_id").eq("id", postId).single();
  if (post && post.author_id !== userId) {
    const { notifyReacted } = await import("@/lib/notifications/events");
    await notifyReacted({
      recipientId: post.author_id,
      actorId: userId,
      postId,
    });
  }
  return { reacted: true };
}

export async function getReactors(postId: string, type: ReactionType): Promise<User[]> {
  const supabase = await supabaseServer();
  const { data: rows } = await supabase
    .from("reactions")
    .select("user_id")
    .eq("post_id", postId)
    .eq("type", type)
    .order("created_at", { ascending: false });
  if (!rows?.length) return [];
  const ids = rows.map((r) => r.user_id);
  const authorMap = await getAuthorMap(supabase, ids);
  return ids.map((id) => authorMap.get(id)).filter((u): u is User => u != null);
}

export async function listNotifications(recipientId: string): Promise<Notification[]> {
  const supabase = await supabaseServer();
  const { data: rows, error } = await supabase
    .from("notifications")
    .select("id, type, recipient_id, actor_id, post_id, read_at, created_at")
    .eq("recipient_id", recipientId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (rows ?? []).map((r) => ({
    id: r.id,
    type: r.type as NotificationType,
    recipientId: r.recipient_id,
    actorId: r.actor_id,
    postId: r.post_id ?? undefined,
    createdAt: r.created_at ?? new Date().toISOString(),
    readAt: r.read_at ?? undefined,
  }));
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", notificationId);
}

export async function markAllNotificationsRead(recipientId: string): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", recipientId).is("read_at", null);
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const supabase = await supabaseServer();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .is("read_at", null);
  if (error) return 0;
  return count ?? 0;
}

export async function searchPosts(params: {
  q: string;
  currentUserId: string;
  scope?: "ALL" | "FOLLOWING";
}): Promise<PostWithAuthor[]> {
  const tokens = tokenize(params.q);
  if (tokens.length === 0) return [];
  const supabase = await supabaseServer();
  let query = supabase.from("posts").select(POSTS_FEED_SELECT).order("created_at", { ascending: false });
  if (params.scope === "FOLLOWING") {
    const { data: followRows } = await supabase.from("follows").select("following_id").eq("follower_id", params.currentUserId);
    const followingIds = (followRows ?? []).map((r) => r.following_id);
    if (followingIds.length === 0) return [];
    query = query.in("author_id", followingIds);
  }
  const { data: rows } = await query;
  if (!rows?.length) return [];
  const authorIds = [...new Set(rows.map((r) => r.author_id))];
  const postIds = rows.map((r) => r.id);
  const [authorMap, reactionCountsMap, { data: reactionRows }] = await Promise.all([
    getAuthorMap(supabase, authorIds),
    getReactionCountsByPostIds(supabase, postIds),
    supabase.from("reactions").select("post_id, type").in("post_id", postIds).eq("user_id", params.currentUserId),
  ]);
  const reactionsByPost = new Map<string, { prayed: boolean; withYou: boolean }>();
  rows.forEach((p) => {
    const userReactions = (reactionRows ?? []).filter((r) => r.post_id === p.id);
    reactionsByPost.set(p.id, { prayed: userReactions.some((x) => x.type === "PRAYED"), withYou: userReactions.some((x) => x.type === "WITH_YOU") });
  });
  const withAuthor = rows.map((r) => {
    const author = authorMap.get(r.author_id);
    if (!author) return null;
    return {
      ...rowToPost(r),
      author,
      reactionsByCurrentUser: reactionsByPost.get(r.id) ?? { prayed: false, withYou: false },
      reactionCounts: reactionCountsMap.get(r.id) ?? { prayed: 0, withYou: 0 },
    } as PostWithAuthor;
  }).filter(Boolean) as PostWithAuthor[];
  const getSearchText = (p: PostWithAuthor) => [p.content, (p.tags ?? []).join(" "), p.author.name].join(" ");
  const sorted = sortByScore(withAuthor, getSearchText, tokens);
  return sorted.slice(0, SEARCH_MAX);
}

export async function searchPeople(params: { q: string; viewerId: string; role?: string; denomination?: string }): Promise<User[]> {
  const tokens = tokenize(params.q);
  if (tokens.length === 0 && !params.role && !params.denomination) return [];
  const supabase = await supabaseServer();
  let query = supabase.from("users").select("id, name, role, bio, affiliation, created_at, deactivated_at, denomination, support_url");
  if (params.role) query = query.eq("role", params.role) as typeof query;
  if (params.denomination) query = query.eq("denomination", params.denomination) as typeof query;
  const { data: rows } = await query;
  if (!rows?.length) return [];
  const users = rows.map((r) => rowToUser(r));
  if (tokens.length === 0) return users.slice(0, SEARCH_MAX);
  const getSearchText = (u: User) => [u.name, u.affiliation ?? "", u.bio ?? ""].join(" ");
  return sortByScore(users, getSearchText, tokens).slice(0, SEARCH_MAX);
}

export async function listAllTags(): Promise<string[]> {
  const supabase = await supabaseServer();
  const { data: rows } = await supabase.from("posts").select("tags");
  const set = new Set<string>();
  (rows ?? []).forEach((r) => (r.tags ?? []).forEach((t: string) => set.add(t)));
  return Array.from(set).sort();
}

export async function listPopularTags(limit = 20): Promise<{ tag: string; sampleCount: number }[]> {
  const supabase = await supabaseServer();
  const { data: rows } = await supabase.from("posts").select("tags");
  const counts = new Map<string, number>();
  (rows ?? []).forEach((r) => (r.tags ?? []).forEach((t: string) => counts.set(t, (counts.get(t) ?? 0) + 1)));
  return Array.from(counts.entries())
    .map(([tag, sampleCount]) => ({ tag, sampleCount }))
    .sort((a, b) => b.sampleCount - a.sampleCount)
    .slice(0, limit);
}

export async function listPostsByTag(
  normalizedTag: string,
  params?: { currentUserId?: string | null; scope?: "ALL" | "FOLLOWING" }
): Promise<PostWithAuthor[]> {
  const supabase = await supabaseServer();
  let query = supabase.from("posts").select(POSTS_FEED_SELECT).contains("tags", [normalizedTag]).order("created_at", { ascending: false });
  if (params?.scope === "FOLLOWING" && params?.currentUserId) {
    const { data: followRows } = await supabase.from("follows").select("following_id").eq("follower_id", params.currentUserId);
    const followingIds = (followRows ?? []).map((r) => r.following_id);
    if (followingIds.length === 0) return [];
    query = query.in("author_id", followingIds);
  }
  const { data: rows } = await query;
  if (!rows?.length) return [];
  const uid = params?.currentUserId ?? null;
  const postIds = rows.map((r) => r.id);
  const [authorMap, reactionCountsMap, { data: reactionRows }] = await Promise.all([
    getAuthorMap(supabase, [...new Set(rows.map((r) => r.author_id))]),
    getReactionCountsByPostIds(supabase, postIds),
    supabase.from("reactions").select("post_id, user_id, type").in("post_id", postIds),
  ]);
  const reactionsByPost = new Map<string, { prayed: boolean; withYou: boolean }>();
  rows.forEach((p) => {
    const userReactions = uid ? (reactionRows ?? []).filter((r) => r.post_id === p.id && r.user_id === uid) : [];
    reactionsByPost.set(p.id, { prayed: userReactions.some((r) => r.type === "PRAYED"), withYou: userReactions.some((r) => r.type === "WITH_YOU") });
  });
  return rows
    .map((r) => {
      const author = authorMap.get(r.author_id);
      if (!author) return null;
      return {
        ...rowToPost(r),
        author,
        reactionsByCurrentUser: reactionsByPost.get(r.id) ?? { prayed: false, withYou: false },
        reactionCounts: reactionCountsMap.get(r.id) ?? { prayed: 0, withYou: 0 },
      } as PostWithAuthor;
    })
    .filter((x): x is PostWithAuthor => x != null);
}

export async function searchTags(q: string): Promise<string[]> {
  const tokens = tokenize(q);
  if (tokens.length === 0) return [];
  const all = await listAllTags();
  return sortByScore(all, (tag) => tag, tokens).slice(0, SEARCH_MAX);
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
  const authorMap = await getAuthorMap(supabase, [authorId]);
  const author = authorMap.get(authorId);
  if (!author) return [];
  const postIds = rows.map((r) => r.id);
  const [reactionCountsMap, { data: reactionRows }] = await Promise.all([
    getReactionCountsByPostIds(supabase, postIds),
    supabase.from("reactions").select("post_id, type").in("post_id", postIds).eq("user_id", uid ?? ""),
  ]);
  const reactionsByPost = new Map<string, { prayed: boolean; withYou: boolean }>();
  rows.forEach((p) => {
    const userReactions = uid ? (reactionRows ?? []).filter((r) => r.post_id === p.id) : [];
    reactionsByPost.set(p.id, { prayed: userReactions.some((r) => r.type === "PRAYED"), withYou: userReactions.some((r) => r.type === "WITH_YOU") });
  });
  return rows.map((r) => ({
    ...rowToPost(r),
    author,
    reactionsByCurrentUser: reactionsByPost.get(r.id) ?? { prayed: false, withYou: false },
    reactionCounts: reactionCountsMap.get(r.id) ?? { prayed: 0, withYou: 0 },
  })) as PostWithAuthor[];
}

export async function listPostsByAuthorIdPaged(params: {
  authorId: string;
  limit: number;
  offset: number;
}): Promise<{ items: PostWithAuthor[]; hasMore: boolean }> {
  const supabase = await supabaseServer();
  const { data: { session: _sess } } = await supabase.auth.getSession();
  const uid = _sess?.user?.id ?? null;
  const fetchLimit = params.limit + 1;
  const { data: rows } = await supabase
    .from("posts")
    .select(POSTS_FEED_SELECT)
    .eq("author_id", params.authorId)
    .order("created_at", { ascending: false })
    .range(params.offset, params.offset + fetchLimit - 1);
  if (!rows?.length) return { items: [], hasMore: false };
  const hasMore = rows.length > params.limit;
  const pageRows = hasMore ? rows.slice(0, params.limit) : rows;
  const authorMap = await getAuthorMap(supabase, [params.authorId]);
  const author = authorMap.get(params.authorId);
  if (!author) return { items: [], hasMore: false };
  const postIds = pageRows.map((r) => r.id);
  const [reactionCountsMap, { data: reactionRows }, commentCountsMap] = await Promise.all([
    getReactionCountsByPostIds(supabase, postIds),
    supabase.from("reactions").select("post_id, type").in("post_id", postIds).eq("user_id", uid ?? ""),
    getCommentCountsByPostIds(supabase, postIds),
  ]);
  const items = pageRows.map((r) => {
    const userReactions = uid ? (reactionRows ?? []).filter((rx) => rx.post_id === r.id) : [];
    return {
      ...rowToPost(r),
      author,
      reactionsByCurrentUser: { prayed: userReactions.some((rx) => rx.type === "PRAYED"), withYou: userReactions.some((rx) => rx.type === "WITH_YOU") },
      reactionCounts: reactionCountsMap.get(r.id) ?? { prayed: 0, withYou: 0 },
      commentCount: commentCountsMap.get(r.id) ?? 0,
    };
  }) as PostWithAuthor[];
  return { items, hasMore };
}

export async function getUserById(id: string): Promise<User | null> {
  const r = await getUserByIdWithError(id);
  return r.user;
}

const USERS_SELECT_FULL = "id, name, role, bio, affiliation, created_at, deactivated_at, denomination, faith_years, username, church, support_url, avatar_url";
const USERS_SELECT_MINIMAL = "id, name, role, bio, affiliation, created_at";

function isColumnError(msg: string): boolean {
  return /column.*does not exist|does not exist.*column|42703/i.test(String(msg));
}

/** Returns user and optional error message for profile/error UI. Tries full select, then minimal if deactivated_at missing. */
export async function getUserByIdWithError(id: string): Promise<{ user: User | null; errorMessage: string | null }> {
  const supabase = await supabaseServer();
  let data: { id: string; name: string | null; role: string | null; bio: string | null; affiliation: string | null; created_at: string | null; deactivated_at?: string | null } | null;
  let error: Error | null = null;
  const full = await supabase.from("users").select(USERS_SELECT_FULL).eq("id", id).single();
  data = full.data as typeof data;
  error = full.error;
  if (error && isColumnError(error.message)) {
    const fallback = await supabase.from("users").select(USERS_SELECT_MINIMAL).eq("id", id).single();
    data = fallback.data ? { ...fallback.data, deactivated_at: null } : null;
    error = fallback.error;
  }
  if (error) return { user: null, errorMessage: error.message };
  if (!data) return { user: null, errorMessage: "No row returned" };
  return { user: rowToUser(data), errorMessage: null };
}

/** Soft-deactivate account: set deactivated_at, hide all posts by user. Caller should sign out after. */
export async function deactivateUser(userId: string): Promise<void> {
  const supabase = await supabaseServer();
  const now = new Date().toISOString();
  const { error: userError } = await supabase.from("users").update({ deactivated_at: now }).eq("id", userId);
  if (userError) throw new Error(userError.message);
  await supabase.from("posts").update({ hidden_at: now }).eq("author_id", userId);
}

/** Restore account within 7 days: clear deactivated_at, unhide user's posts. */
export async function restoreUser(userId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await supabaseServer();
  const { data: row } = await supabase.from("users").select("deactivated_at").eq("id", userId).single();
  if (!row?.deactivated_at) return { ok: false, error: "Account is not deactivated" };
  const at = new Date(row.deactivated_at).getTime();
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  if (at < cutoff) return { ok: false, error: "Restore window has expired" };
  const { error: userError } = await supabase.from("users").update({ deactivated_at: null }).eq("id", userId);
  if (userError) return { ok: false, error: userError.message };
  await supabase.from("posts").update({ hidden_at: null, hidden_by: null }).eq("author_id", userId);
  return { ok: true };
}

/** Update own profile fields. Uses user's own session (RLS allows self-update). */
export async function updateUserProfile(
  userId: string,
  data: {
    name?: string;
    username?: string | null;
    bio?: string | null;
    affiliation?: string | null;
    church?: string | null;
    denomination?: string | null;
    faithYears?: number | null;
    role?: UserRole;
    supportUrl?: string | null;
  }
): Promise<{ ok: true } | { error: string }> {
  const supabase = await supabaseServer();
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name.trim() || undefined;
  if ("username" in data) update.username = data.username?.trim() || null;
  if ("bio" in data) update.bio = data.bio?.trim() || null;
  if ("affiliation" in data) update.affiliation = data.affiliation?.trim() || null;
  if ("church" in data) update.church = data.church?.trim() || null;
  if ("denomination" in data) update.denomination = data.denomination?.trim() || null;
  if ("faithYears" in data) update.faith_years = data.faithYears ?? null;
  if (data.role !== undefined) update.role = data.role;
  if ("supportUrl" in data) update.support_url = data.supportUrl?.trim() || null;
  if (Object.keys(update).length === 0) return { ok: true };
  const { error } = await supabase.from("users").update(update).eq("id", userId);
  if (error) {
    if (/unique|duplicate/i.test(error.message)) return { error: "이 사용자 이름은 이미 사용 중입니다." };
    return { error: error.message };
  }
  return { ok: true };
}

/**
 * Suggest people the user might want to follow.
 * Returns up to `limit` users with the same role, excluding those already followed.
 */
export async function suggestPeopleToFollow(params: {
  currentUserId: string;
  role: UserRole;
  limit?: number;
}): Promise<User[]> {
  const supabase = await supabaseServer();
  const limit = params.limit ?? 5;

  const { data: alreadyFollowing } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", params.currentUserId);

  const excludeIds = new Set<string>(
    (alreadyFollowing ?? []).map((f: { following_id: string }) => f.following_id)
  );
  excludeIds.add(params.currentUserId);

  const { data: rows } = await supabase
    .from("users")
    .select(USERS_SELECT_FULL)
    .eq("role", params.role)
    .is("deactivated_at", null)
    .limit(limit + excludeIds.size + 5);

  if (!rows?.length) return [];
  return rows
    .map((r) => rowToUser(r))
    .filter((u) => !excludeIds.has(u.id))
    .slice(0, limit);
}

// ----- Bookmarks -----

export async function toggleBookmark(userId: string, postId: string): Promise<{ bookmarked: boolean }> {
  const supabase = await supabaseServer();
  const { data: existing } = await supabase
    .from("user_bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .maybeSingle();
  if (existing) {
    await supabase.from("user_bookmarks").delete().eq("id", existing.id);
    return { bookmarked: false };
  }
  await supabase.from("user_bookmarks").insert({ user_id: userId, post_id: postId });
  return { bookmarked: true };
}

export async function listBookmarks(userId: string, limit = 50): Promise<PostWithAuthor[]> {
  const supabase = await supabaseServer();
  const { data: bookmarkRows } = await supabase
    .from("user_bookmarks")
    .select("post_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!bookmarkRows?.length) return [];
  const postIds = bookmarkRows.map((r) => r.post_id);
  const { data: rows } = await supabase
    .from("posts")
    .select(POSTS_FEED_SELECT)
    .in("id", postIds);
  if (!rows?.length) return [];
  const authorIds = [...new Set(rows.map((r) => r.author_id))];
  const [authorMap, reactionCountsMap, commentCountsMap, { data: reactionRows }] = await Promise.all([
    getAuthorMap(supabase, authorIds),
    getReactionCountsByPostIds(supabase, postIds),
    getCommentCountsByPostIds(supabase, postIds),
    supabase.from("reactions").select("post_id, type").in("post_id", postIds).eq("user_id", userId),
  ]);
  const reactionsByPost = new Map<string, { prayed: boolean; withYou: boolean }>();
  rows.forEach((p) => {
    const userReactions = (reactionRows ?? []).filter((r) => r.post_id === p.id);
    reactionsByPost.set(p.id, {
      prayed: userReactions.some((r) => r.type === "PRAYED"),
      withYou: userReactions.some((r) => r.type === "WITH_YOU"),
    });
  });
  const postMap = new Map(rows.map((r) => [r.id, r]));
  return bookmarkRows
    .map((b) => {
      const r = postMap.get(b.post_id);
      if (!r) return null;
      const author = authorMap.get(r.author_id) ?? placeholderUser(r.author_id);
      return {
        ...rowToPost(r),
        author,
        reactionsByCurrentUser: reactionsByPost.get(r.id) ?? { prayed: false, withYou: false },
        reactionCounts: reactionCountsMap.get(r.id) ?? { prayed: 0, withYou: 0 },
        commentCount: commentCountsMap.get(r.id) ?? 0,
      } as PostWithAuthor;
    })
    .filter((x): x is PostWithAuthor => x != null);
}

export async function getBookmarkedPostIds(userId: string, postIds: string[]): Promise<string[]> {
  if (!postIds.length) return [];
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("user_bookmarks")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);
  return (data ?? []).map((r) => r.post_id);
}

export async function createReport(params: {
  type: "REPORT_POST" | "REPORT_COMMENT" | "REPORT_USER";
  reporterId: string;
  postId?: string;
  commentId?: string;
  reason?: string;
  targetUserId?: string;
}): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.from("moderation_reports").insert({
    type: params.type,
    reporter_id: params.reporterId,
    post_id: params.postId ?? null,
    comment_id: params.commentId ?? null,
    reason: params.reason ?? null,
    target_user_id: params.targetUserId ?? null,
    status: "OPEN",
  });
}

export async function getCommentAuthorId(commentId: string): Promise<string | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("comments").select("author_id").eq("id", commentId).single();
  return data?.author_id ?? null;
}

// ----- Notes (private, My Space; RLS: auth.uid() = user_id) -----

function rowToNote(r: {
  id: string;
  user_id: string;
  type: string;
  title: string | null;
  content: string;
  tags: string[] | null;
  is_archived: boolean | null;
  share_to_profile: boolean | null;
  published_post_id: string | null;
  status: string | null;
  answer_note: string | null;
  created_at: string | null;
  updated_at: string | null;
}): Note {
  return {
    id: r.id,
    userId: r.user_id,
    type: r.type as NoteType,
    title: r.title ?? undefined,
    content: r.content,
    tags: r.tags ?? [],
    isArchived: r.is_archived ?? false,
    shareToProfile: r.share_to_profile ?? false,
    publishedPostId: r.published_post_id ?? undefined,
    status: (r.status as Note["status"]) ?? undefined,
    answerNote: r.answer_note ?? undefined,
    createdAt: r.created_at ?? new Date().toISOString(),
    updatedAt: r.updated_at ?? undefined,
  };
}

export async function hasNoteOfTypeToday(params: {
  userId: string;
  type: "PRAYER" | "GRATITUDE";
}): Promise<boolean> {
  const supabase = await supabaseServer();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const startOfToday = start.toISOString();
  const { data, error } = await supabase
    .from("notes")
    .select("id")
    .eq("user_id", params.userId)
    .eq("type", params.type)
    .gte("created_at", startOfToday)
    .limit(1);
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

export async function listNotesByType(params: {
  userId: string;
  type: NoteType;
  limit?: number;
}): Promise<Note[]> {
  const supabase = await supabaseServer();
  const limit = params.limit ?? 50;
  const { data: rows, error } = await supabase
    .from("notes")
    .select("id, user_id, type, title, content, tags, is_archived, share_to_profile, published_post_id, status, answer_note, created_at, updated_at")
    .eq("user_id", params.userId)
    .eq("type", params.type)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (rows ?? []).map(rowToNote);
}

export async function createNote(params: {
  userId: string;
  type: NoteType;
  title?: string;
  content: string;
  tags?: string[];
}): Promise<Note> {
  const supabase = await supabaseServer();
  const tags = (params.tags ?? []).slice(0, 5).map((t) => t.trim().toLowerCase()).filter(Boolean);
  const { data: row, error } = await supabase
    .from("notes")
    .insert({
      user_id: params.userId,
      type: params.type,
      title: params.title?.trim() || null,
      content: params.content.trim(),
      tags,
      share_to_profile: false,
      ...(params.type === "PRAYER" && { status: "ONGOING" }),
    })
    .select("id, user_id, type, title, content, tags, is_archived, share_to_profile, published_post_id, status, answer_note, created_at, updated_at")
    .single();
  if (error) throw new Error(error.message);
  return rowToNote(row);
}

export async function updateNote(params: {
  userId: string;
  noteId: string;
  title?: string;
  content?: string;
  tags?: string[];
  isArchived?: boolean;
}): Promise<Note | null> {
  const supabase = await supabaseServer();
  const { data: existing } = await supabase.from("notes").select("id, user_id").eq("id", params.noteId).single();
  if (!existing || existing.user_id !== params.userId) return null;
  const updates: Record<string, unknown> = {};
  if (params.title !== undefined) updates.title = params.title.trim() || null;
  if (params.content !== undefined) updates.content = params.content.trim();
  if (params.tags !== undefined) updates.tags = params.tags.slice(0, 5).map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (params.isArchived !== undefined) updates.is_archived = params.isArchived;
  updates.updated_at = new Date().toISOString();
  const { data: row, error } = await supabase
    .from("notes")
    .update(updates)
    .eq("id", params.noteId)
    .eq("user_id", params.userId)
    .select("id, user_id, type, title, content, tags, is_archived, share_to_profile, published_post_id, status, answer_note, created_at, updated_at")
    .single();
  if (error || !row) return null;
  return rowToNote(row);
}

export async function deleteNote(params: { userId: string; noteId: string }): Promise<boolean> {
  const supabase = await supabaseServer();
  const { data: existing } = await supabase.from("notes").select("id, user_id").eq("id", params.noteId).single();
  if (!existing || existing.user_id !== params.userId) return false;
  const { error } = await supabase.from("notes").delete().eq("id", params.noteId).eq("user_id", params.userId);
  return !error;
}

export async function getNoteById(params: { userId: string; noteId: string }): Promise<Note | null> {
  const supabase = await supabaseServer();
  const { data: row, error } = await supabase
    .from("notes")
    .select("id, user_id, type, title, content, tags, is_archived, share_to_profile, published_post_id, status, answer_note, created_at, updated_at")
    .eq("id", params.noteId)
    .eq("user_id", params.userId)
    .single();
  if (error || !row) return null;
  return rowToNote(row);
}

export async function listSharedNotesByUserId(params: {
  userId: string;
  type?: NoteType;
  limit?: number;
}): Promise<Note[]> {
  const supabase = await supabaseServer();
  const limit = params.limit ?? 50;
  let query = supabase
    .from("notes")
    .select("id, user_id, type, title, content, tags, is_archived, share_to_profile, published_post_id, status, answer_note, created_at, updated_at")
    .eq("user_id", params.userId)
    .eq("share_to_profile", true)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (params.type != null) {
    query = query.eq("type", params.type);
  }
  const { data: rows, error } = await query;
  if (error) return [];
  return (rows ?? []).map(rowToNote);
}

export async function listSharedNotesByUserIdPaged(params: {
  userId: string;
  limit: number;
  offset: number;
}): Promise<{ items: Note[]; hasMore: boolean }> {
  const supabase = await supabaseServer();
  const fetchLimit = params.limit + 1;
  const { data: rows, error } = await supabase
    .from("notes")
    .select("id, user_id, type, title, content, tags, is_archived, share_to_profile, published_post_id, status, answer_note, created_at, updated_at")
    .eq("user_id", params.userId)
    .eq("share_to_profile", true)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .range(params.offset, params.offset + fetchLimit - 1);
  if (error || !rows?.length) return { items: [], hasMore: false };
  const hasMore = rows.length > params.limit;
  return { items: (hasMore ? rows.slice(0, params.limit) : rows).map(rowToNote), hasMore };
}

export async function toggleShareToProfile(params: {
  userId: string;
  noteId: string;
  value: boolean;
}): Promise<boolean> {
  const supabase = await supabaseServer();
  const { data: existing } = await supabase
    .from("notes")
    .select("id, user_id")
    .eq("id", params.noteId)
    .single();
  if (!existing || existing.user_id !== params.userId) return false;
  const { error } = await supabase
    .from("notes")
    .update({ share_to_profile: params.value, updated_at: new Date().toISOString() })
    .eq("id", params.noteId)
    .eq("user_id", params.userId);
  return !error;
}

export async function publishNoteToCommunity(params: {
  userId: string;
  noteId: string;
}): Promise<{ postId: string }> {
  const supabase = await supabaseServer();
  const note = await getNoteById({ userId: params.userId, noteId: params.noteId });
  if (!note) throw new Error("Note not found");
  if (note.publishedPostId) return { postId: note.publishedPostId };
  const post = await createPost({
    authorId: params.userId,
    category: "PRAYER",
    content: note.content,
    visibility: "MEMBERS",
    tags: note.tags ?? [],
  });
  const { error } = await supabase
    .from("notes")
    .update({
      published_post_id: post.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.noteId)
    .eq("user_id", params.userId);
  if (error) throw new Error(error.message);
  return { postId: post.id };
}

export async function updatePrayerAnswer(params: {
  userId: string;
  noteId: string;
  answerNote: string;
}): Promise<boolean> {
  const supabase = await supabaseServer();
  const note = await getNoteById({ userId: params.userId, noteId: params.noteId });
  if (!note || note.type !== "PRAYER" || note.status !== "ANSWERED") return false;
  const { error } = await supabase
    .from("notes")
    .update({
      answer_note: params.answerNote.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.noteId)
    .eq("user_id", params.userId);
  return !error;
}

export async function publishPrayerAsTestimony(params: {
  userId: string;
  noteId: string;
}): Promise<{ postId: string } | null> {
  const supabase = await supabaseServer();
  const note = await getNoteById({ userId: params.userId, noteId: params.noteId });
  if (
    !note ||
    note.type !== "PRAYER" ||
    note.status !== "ANSWERED" ||
    !note.answerNote?.trim()
  )
    return null;
  if (note.publishedPostId) return { postId: note.publishedPostId };
  const content = `Prayer:\n${note.content}\n\n---\nAnswer:\n${note.answerNote}`;
  const tags = ["testimony", ...(note.tags ?? [])].slice(0, 5);
  const post = await createPost({
    authorId: params.userId,
    category: "TESTIMONY",
    content,
    visibility: "MEMBERS",
    tags,
  });
  const { error } = await supabase
    .from("notes")
    .update({
      published_post_id: post.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.noteId)
    .eq("user_id", params.userId);
  if (error) throw new Error(error.message);
  return { postId: post.id };
}

export interface MySpaceOverview {
  activePrayers: number;
  answeredPrayers: number;
  gratitudeThisWeek: number;
  lastReflection: string | null;
}

export async function getMySpaceOverview(userId: string): Promise<MySpaceOverview> {
  const supabase = await supabaseServer();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [activeRes, answeredRes, gratitudeRes, lastRes] = await Promise.all([
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "PRAYER")
      .eq("is_archived", false)
      .or("status.eq.ONGOING,status.is.null"),
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "PRAYER")
      .eq("status", "ANSWERED"),
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "GRATITUDE")
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("notes")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    activePrayers: activeRes.count ?? 0,
    answeredPrayers: answeredRes.count ?? 0,
    gratitudeThisWeek: gratitudeRes.count ?? 0,
    lastReflection: lastRes.data?.created_at ?? null,
  };
}

// ─── Support / Fintech ────────────────────────────────────────────────────────

function rowToMinistry(r: {
  id: string; name: string; description: string;
  location: string | null; support_account: string | null;
}): Ministry {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    location: r.location ?? undefined,
    supportAccount: r.support_account ?? undefined,
  };
}

function rowToIntent(r: {
  id: string; ministry_id: string; donor_id: string | null;
  purpose: string; amount_krw: number; status: string;
  message: string | null; created_at: string; updated_at: string;
}): SupportIntent {
  return {
    id: r.id,
    ministryId: r.ministry_id,
    donorId: r.donor_id,
    purpose: r.purpose as SupportPurpose,
    amountKrw: r.amount_krw,
    status: r.status as SupportIntent["status"],
    message: r.message,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listMinistries(): Promise<Ministry[]> {
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase
      .from("ministries")
      .select("id, name, description, location, support_account")
      .eq("active", true)
      .order("created_at", { ascending: true });
    if (error) { console.error("[listMinistries]", error.message); return []; }
    return (data ?? []).map(rowToMinistry);
  } catch (e) {
    console.error("[listMinistries] caught:", e); return [];
  }
}

export async function getMinistryById(id: string): Promise<Ministry | null> {
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase
      .from("ministries")
      .select("id, name, description, location, support_account")
      .eq("id", id)
      .eq("active", true)
      .single();
    if (error || !data) { return null; }
    return rowToMinistry(data as any);
  } catch { return null; }
}

export async function createSupportIntent(input: {
  ministryId: string;
  donorId: string | null;
  purpose: SupportPurpose;
  amountKrw: number;
  message?: string;
}): Promise<SupportIntent> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Admin client unavailable");
  const { data, error } = await admin
    .from("support_intents")
    .insert({
      ministry_id: input.ministryId,
      donor_id: input.donorId,
      purpose: input.purpose,
      amount_krw: input.amountKrw,
      message: input.message ?? null,
      status: "PENDING",
    })
    .select("*")
    .single();
  if (error) { console.error("[createSupportIntent]", error.message); throw new Error(error.message); }
  return rowToIntent(data as any);
}

export async function getSupportIntent(id: string): Promise<SupportIntent | null> {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return null;
    const { data, error } = await admin
      .from("support_intents")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return rowToIntent(data as any);
  } catch { return null; }
}

export async function completeSupportIntent(
  intentId: string,
  tx: {
    providerPaymentId: string;
    providerOrderId: string;
    amountKrw: number;
    status: string;
    rawResponse: Record<string, unknown>;
  }
): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Admin client unavailable");
  await Promise.all([
    admin.from("support_intents").update({ status: "COMPLETED" }).eq("id", intentId),
    admin.from("support_transactions").insert({
      intent_id: intentId,
      provider: "TOSS",
      provider_payment_id: tx.providerPaymentId,
      provider_order_id: tx.providerOrderId,
      amount_krw: tx.amountKrw,
      status: tx.status,
      raw_response: tx.rawResponse,
    }),
  ]);
}

export async function failSupportIntent(intentId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  await admin.from("support_intents").update({ status: "FAILED" }).eq("id", intentId);
}

// ─── Comment Reactions ─────────────────────────────────────────────────────

export async function toggleCommentLike(
  commentId: string,
  userId: string
): Promise<{ liked: boolean; count: number }> {
  const supabase = await supabaseServer();
  const { data: existing } = await supabase
    .from("comment_reactions")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .eq("type", "LIKE")
    .maybeSingle();

  if (existing) {
    await supabase.from("comment_reactions").delete().eq("id", existing.id);
  } else {
    await supabase.from("comment_reactions").insert({ comment_id: commentId, user_id: userId, type: "LIKE" });
  }

  const { count } = await supabase
    .from("comment_reactions")
    .select("id", { count: "exact", head: true })
    .eq("comment_id", commentId)
    .eq("type", "LIKE");

  return { liked: !existing, count: count ?? 0 };
}

export async function getCommentLikeCounts(
  commentIds: string[],
  viewerId: string | null
): Promise<Record<string, { count: number; likedByMe: boolean }>> {
  if (!commentIds.length) return {};
  const supabase = await supabaseServer();
  const { data: rows } = await supabase
    .from("comment_reactions")
    .select("comment_id, user_id")
    .in("comment_id", commentIds)
    .eq("type", "LIKE");

  const result: Record<string, { count: number; likedByMe: boolean }> = {};
  for (const id of commentIds) result[id] = { count: 0, likedByMe: false };
  for (const r of rows ?? []) {
    const entry = result[r.comment_id];
    if (entry) {
      entry.count += 1;
      if (viewerId && r.user_id === viewerId) entry.likedByMe = true;
    }
  }
  return result;
}

// ─── Direct Messages ────────────────────────────────────────────────────────

export async function sendDirectMessage(
  senderId: string,
  recipientId: string,
  content: string
): Promise<DirectMessage> {
  const supabase = await supabaseServer();
  const { data: row, error } = await supabase
    .from("direct_messages")
    .insert({ sender_id: senderId, recipient_id: recipientId, content: content.trim() })
    .select("id, sender_id, recipient_id, content, created_at, read_at")
    .single();
  if (error || !row) throw new Error(error?.message ?? "Failed to send message");
  return {
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    content: row.content,
    createdAt: row.created_at,
    readAt: row.read_at ?? undefined,
  };
}

export async function listConversations(userId: string): Promise<ConversationPreview[]> {
  const supabase = await supabaseServer();
  // Get all DMs involving this user, ordered by created_at desc
  const { data: rows } = await supabase
    .from("direct_messages")
    .select("id, sender_id, recipient_id, content, created_at, read_at")
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(500);

  if (!rows?.length) return [];

  // Group by partner (the other user in the conversation)
  const seenPartners = new Set<string>();
  const latestByPartner = new Map<string, typeof rows[0]>();
  const unreadByPartner = new Map<string, number>();

  for (const row of rows) {
    const partnerId = row.sender_id === userId ? row.recipient_id : row.sender_id;
    if (!latestByPartner.has(partnerId)) {
      latestByPartner.set(partnerId, row);
    }
    if (!seenPartners.has(partnerId)) {
      seenPartners.add(partnerId);
      unreadByPartner.set(partnerId, 0);
    }
    // Count unread: messages sent TO this user that have no read_at
    if (row.recipient_id === userId && !row.read_at) {
      unreadByPartner.set(partnerId, (unreadByPartner.get(partnerId) ?? 0) + 1);
    }
  }

  const partnerIds = [...seenPartners];
  const authorMap = await getAuthorMap(supabase, partnerIds);

  return partnerIds
    .map((partnerId) => {
      const latest = latestByPartner.get(partnerId)!;
      const partner = authorMap.get(partnerId);
      if (!partner) return null;
      return {
        partner,
        latestMessage: {
          content: latest.content,
          createdAt: latest.created_at,
          senderId: latest.sender_id,
        },
        unreadCount: unreadByPartner.get(partnerId) ?? 0,
      } satisfies ConversationPreview;
    })
    .filter((c): c is ConversationPreview => c !== null);
}

export async function listMessages(
  userId: string,
  partnerId: string,
  limit = 100
): Promise<(DirectMessage & { sender: import("@/lib/domain/types").User })[]> {
  const supabase = await supabaseServer();
  const { data: rows } = await supabase
    .from("direct_messages")
    .select("id, sender_id, recipient_id, content, created_at, read_at")
    .or(
      `and(sender_id.eq.${userId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${userId})`
    )
    .order("created_at", { ascending: true })
    .limit(limit);

  if (!rows?.length) return [];

  const authorMap = await getAuthorMap(supabase, [userId, partnerId]);
  return rows.map((r) => ({
    id: r.id,
    senderId: r.sender_id,
    recipientId: r.recipient_id,
    content: r.content,
    createdAt: r.created_at,
    readAt: r.read_at ?? undefined,
    sender: authorMap.get(r.sender_id) ?? { id: r.sender_id, name: "Unknown", role: "LAY" as const, createdAt: r.created_at },
  }));
}

export async function markConversationRead(userId: string, partnerId: string): Promise<void> {
  const supabase = await supabaseServer();
  await supabase
    .from("direct_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", userId)
    .eq("sender_id", partnerId)
    .is("read_at", null);
}

export async function countUnreadDMs(userId: string): Promise<number> {
  const supabase = await supabaseServer();
  const { count } = await supabase
    .from("direct_messages")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

// =============================================================
// Notification preferences
// =============================================================

function parseNotifPrefs(raw: unknown): NotificationPrefs {
  const defaults = DEFAULT_NOTIFICATION_PREFS;
  if (!raw || typeof raw !== "object") return { ...defaults };
  const r = raw as Record<string, unknown>;
  return {
    pushComments:        typeof r.pushComments        === "boolean" ? r.pushComments        : defaults.pushComments,
    pushReactions:       typeof r.pushReactions       === "boolean" ? r.pushReactions       : defaults.pushReactions,
    pushFollowers:       typeof r.pushFollowers       === "boolean" ? r.pushFollowers       : defaults.pushFollowers,
    pushCellMessages:    typeof r.pushCellMessages    === "boolean" ? r.pushCellMessages    : defaults.pushCellMessages,
    pushPrayerResponses: typeof r.pushPrayerResponses === "boolean" ? r.pushPrayerResponses : defaults.pushPrayerResponses,
    emailWeeklyDigest:   typeof r.emailWeeklyDigest   === "boolean" ? r.emailWeeklyDigest   : defaults.emailWeeklyDigest,
    emailCellInvites:    typeof r.emailCellInvites    === "boolean" ? r.emailCellInvites    : defaults.emailCellInvites,
  };
}

export async function getNotificationPrefs(userId: string): Promise<NotificationPrefs> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("users")
    .select("notification_prefs")
    .eq("id", userId)
    .single();
  return parseNotifPrefs(data?.notification_prefs);
}

export async function updateNotificationPrefs(
  userId: string,
  prefs: Partial<NotificationPrefs>
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await supabaseServer();
  const current = await getNotificationPrefs(userId);
  const merged = { ...current, ...prefs };
  const { error } = await supabase
    .from("users")
    .update({ notification_prefs: merged })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// =============================================================
// Prayer requests
// =============================================================

function rowToPrayerRequest(r: {
  id: string;
  user_id: string;
  content: string;
  category: string;
  visibility: string;
  answered_at?: string | null;
  answer_note?: string | null;
  created_at: string;
  users?: { id: string; name: string | null; role: string | null; bio: string | null; affiliation: string | null; created_at: string | null; avatar_url?: string | null } | null;
  prayer_intercessions?: { count: number }[] | null;
  viewer_prayed?: boolean;
}): PrayerRequest {
  return {
    id: r.id,
    userId: r.user_id,
    content: r.content,
    category: r.category as PrayerCategory,
    visibility: r.visibility as PrayerRequest["visibility"],
    answeredAt: r.answered_at ?? null,
    answerNote: r.answer_note ?? null,
    createdAt: r.created_at,
    author: r.users ? rowToUser(r.users as any) : undefined,
    intercessorCount: r.prayer_intercessions?.[0]?.count ?? 0,
    hasPrayed: r.viewer_prayed ?? false,
  };
}

export async function listPrayerRequests(opts: {
  limit?: number;
  userId?: string | null; // filter to specific user's requests
  viewerId?: string | null;
  onlyAnswered?: boolean;
} = {}): Promise<PrayerRequest[]> {
  const supabase = await supabaseServer();
  const limit = opts.limit ?? 30;

  let q = supabase
    .from("prayer_requests")
    .select("*, users(id,name,role,bio,affiliation,created_at,avatar_url), prayer_intercessions(count)")
    .eq("visibility", "PUBLIC")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (opts.userId) q = q.eq("user_id", opts.userId);
  if (opts.onlyAnswered) q = q.not("answered_at", "is", null);

  const { data, error } = await q;
  if (error) { console.error("[listPrayerRequests]", error.message); return []; }

  const rows = (data ?? []) as any[];
  if (!opts.viewerId) return rows.map(rowToPrayerRequest);

  // Check which ones the viewer has prayed for
  const ids = rows.map((r: any) => r.id);
  const { data: intercessions } = await supabase
    .from("prayer_intercessions")
    .select("prayer_request_id")
    .in("prayer_request_id", ids)
    .eq("user_id", opts.viewerId);
  const prayedSet = new Set((intercessions ?? []).map((i: any) => i.prayer_request_id));
  return rows.map((r: any) => rowToPrayerRequest({ ...r, viewer_prayed: prayedSet.has(r.id) }));
}

export async function getPrayerRequestById(id: string, viewerId?: string | null): Promise<PrayerRequest | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("prayer_requests")
    .select("*, users(id,name,role,bio,affiliation,created_at,avatar_url), prayer_intercessions(count)")
    .eq("id", id)
    .single();
  if (error || !data) return null;

  let hasPrayed = false;
  if (viewerId) {
    const { data: pi } = await supabase
      .from("prayer_intercessions")
      .select("id")
      .eq("prayer_request_id", id)
      .eq("user_id", viewerId)
      .single();
    hasPrayed = !!pi;
  }
  return rowToPrayerRequest({ ...(data as any), viewer_prayed: hasPrayed });
}

export async function createPrayerRequest(input: {
  userId: string;
  content: string;
  category: PrayerCategory;
  visibility: "PUBLIC" | "CELL" | "PRIVATE";
}): Promise<PrayerRequest> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("prayer_requests")
    .insert({ user_id: input.userId, content: input.content.trim(), category: input.category, visibility: input.visibility })
    .select("*, users(id,name,role,bio,affiliation,created_at,avatar_url), prayer_intercessions(count)")
    .single();
  if (error) throw new Error(error.message);
  return rowToPrayerRequest(data as any);
}

export async function intercedeForPrayer(prayerRequestId: string, userId: string, message?: string): Promise<void> {
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("prayer_intercessions")
    .upsert({ prayer_request_id: prayerRequestId, user_id: userId, message: message ?? null }, { onConflict: "prayer_request_id,user_id" });
  if (error) throw new Error(error.message);
}

export async function removeIntercession(prayerRequestId: string, userId: string): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.from("prayer_intercessions").delete().match({ prayer_request_id: prayerRequestId, user_id: userId });
}

export async function markPrayerAnswered(prayerRequestId: string, userId: string, answerNote?: string): Promise<void> {
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("prayer_requests")
    .update({ answered_at: new Date().toISOString(), answer_note: answerNote ?? null })
    .eq("id", prayerRequestId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function deletePrayerRequest(id: string, userId: string): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.from("prayer_requests").delete().eq("id", id).eq("user_id", userId);
}

export async function listPrayerIntercessions(prayerRequestId: string): Promise<PrayerIntercession[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("prayer_intercessions")
    .select("*, users(id,name,role,bio,affiliation,created_at,avatar_url)")
    .eq("prayer_request_id", prayerRequestId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return [];
  return (data ?? []).map((r: any) => ({
    id: r.id,
    prayerRequestId: r.prayer_request_id,
    userId: r.user_id,
    message: r.message ?? null,
    createdAt: r.created_at,
    author: r.users ? rowToUser(r.users) : undefined,
  }));
}

// =============================================================
// Missionary projects
// =============================================================

function rowToMissionaryProject(r: {
  id: string;
  missionary_id: string;
  title: string;
  country?: string | null;
  field?: string | null;
  description?: string | null;
  status: string;
  created_at: string;
  users?: { id: string; name: string | null; role: string | null; bio: string | null; affiliation: string | null; created_at: string | null; avatar_url?: string | null } | null;
  missionary_supporters?: { count: number }[] | null;
  viewer_supports?: boolean;
}): MissionaryProject {
  return {
    id: r.id,
    missionaryId: r.missionary_id,
    title: r.title,
    country: r.country ?? null,
    field: r.field ?? null,
    description: r.description ?? null,
    status: r.status as MissionaryProjectStatus,
    createdAt: r.created_at,
    missionary: r.users ? rowToUser(r.users as any) : undefined,
    supporterCount: r.missionary_supporters?.[0]?.count ?? 0,
    hasPrayerSupport: r.viewer_supports ?? false,
  };
}

export async function listMissionaryProjects(opts: { missionaryId?: string; viewerId?: string | null; limit?: number } = {}): Promise<MissionaryProject[]> {
  const supabase = await supabaseServer();
  const limit = opts.limit ?? 30;

  let q = supabase
    .from("missionary_projects")
    .select("*, users(id,name,role,bio,affiliation,created_at,avatar_url), missionary_supporters(count)")
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (opts.missionaryId) q = q.eq("missionary_id", opts.missionaryId);

  const { data, error } = await q;
  if (error) { console.error("[listMissionaryProjects]", error.message); return []; }

  const rows = (data ?? []) as any[];
  if (!opts.viewerId) return rows.map(rowToMissionaryProject);

  const ids = rows.map((r: any) => r.id);
  const { data: supports } = await supabase
    .from("missionary_supporters")
    .select("project_id")
    .in("project_id", ids)
    .eq("user_id", opts.viewerId);
  const supportSet = new Set((supports ?? []).map((s: any) => s.project_id));
  return rows.map((r: any) => rowToMissionaryProject({ ...r, viewer_supports: supportSet.has(r.id) }));
}

export async function getMissionaryProjectById(id: string, viewerId?: string | null): Promise<MissionaryProject | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("missionary_projects")
    .select("*, users(id,name,role,bio,affiliation,created_at,avatar_url), missionary_supporters(count)")
    .eq("id", id)
    .single();
  if (error || !data) return null;

  let viewerSupports = false;
  if (viewerId) {
    const { data: s } = await supabase
      .from("missionary_supporters")
      .select("id")
      .eq("project_id", id)
      .eq("user_id", viewerId)
      .single();
    viewerSupports = !!s;
  }
  return rowToMissionaryProject({ ...(data as any), viewer_supports: viewerSupports });
}

export async function createMissionaryProject(input: {
  missionaryId: string;
  title: string;
  country?: string;
  field?: string;
  description?: string;
}): Promise<MissionaryProject> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("missionary_projects")
    .insert({
      missionary_id: input.missionaryId,
      title: input.title.trim(),
      country: input.country?.trim() ?? null,
      field: input.field?.trim() ?? null,
      description: input.description?.trim() ?? null,
    })
    .select("*, users(id,name,role,bio,affiliation,created_at,avatar_url), missionary_supporters(count)")
    .single();
  if (error) throw new Error(error.message);
  return rowToMissionaryProject(data as any);
}

export async function listMissionaryReports(projectId: string): Promise<MissionaryReport[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("missionary_reports")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((r: any) => ({
    id: r.id,
    projectId: r.project_id,
    content: r.content,
    createdAt: r.created_at,
  }));
}

export async function createMissionaryReport(projectId: string, content: string): Promise<MissionaryReport> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("missionary_reports")
    .insert({ project_id: projectId, content: content.trim() })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, projectId: data.project_id, content: data.content, createdAt: data.created_at };
}

export async function listMissionarySupporters(projectId: string): Promise<MissionarySupporter[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("missionary_supporters")
    .select("*, users(id,name,role,bio,affiliation,created_at,avatar_url)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((r: any) => ({
    id: r.id,
    projectId: r.project_id,
    userId: r.user_id,
    supportType: r.support_type as SupportType,
    createdAt: r.created_at,
    user: r.users ? rowToUser(r.users) : undefined,
  }));
}

export async function toggleMissionarySupport(projectId: string, userId: string): Promise<"added" | "removed"> {
  const supabase = await supabaseServer();
  const { data: existing } = await supabase
    .from("missionary_supporters")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .single();
  if (existing) {
    await supabase.from("missionary_supporters").delete().eq("id", existing.id);
    return "removed";
  }
  await supabase.from("missionary_supporters").insert({ project_id: projectId, user_id: userId, support_type: "PRAYER" });
  return "added";
}

/**
 * Upload a profile avatar to Supabase Storage and update the user's avatar_url.
 * Bucket: avatars (public). Path: {userId}/avatar.{ext}
 */
export async function uploadAvatar(
  userId: string,
  fileBuffer: ArrayBuffer,
  mimeType: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "Storage not available" };

  const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, fileBuffer, { contentType: mimeType, upsert: true });

  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: urlData } = admin.storage.from("avatars").getPublicUrl(path);
  const url = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await admin
    .from("users")
    .update({ avatar_url: url })
    .eq("id", userId);

  if (updateError) return { ok: false, error: updateError.message };

  return { ok: true, url };
}

// =============================================================
// Cells by member
// =============================================================

export async function listCellsByUserId(userId: string): Promise<Cell[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("cell_memberships")
    .select("cells(*, cell_memberships(count))")
    .eq("user_id", userId);
  if (error) { console.error("[listCellsByUserId]", error.message); return []; }
  return (data ?? [])
    .map((row: any) => row.cells)
    .filter(Boolean)
    .map(rowToCell);
}

// =============================================================
// Suggested users (not yet followed by currentUserId)
// =============================================================

export async function listSuggestedUsers(currentUserId: string, limit = 20): Promise<User[]> {
  const supabase = await supabaseServer();
  // Get IDs already followed
  const { data: followRows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", currentUserId);
  const followingIds = (followRows ?? []).map((r: any) => r.following_id);
  const excludeIds = [...followingIds, currentUserId];

  const { data, error } = await supabase
    .from("users")
    .select("id, name, role, bio, affiliation, created_at, avatar_url, church")
    .not("id", "in", `(${excludeIds.join(",")})`)
    .is("deactivated_at", null)
    .limit(limit);
  if (error) { console.error("[listSuggestedUsers]", error.message); return []; }
  return (data ?? []).map((r: any) => rowToUser(r));
}

// =============================================================
// Creator stats
// =============================================================

export async function getCreatorStats(authorId: string): Promise<{
  postCount: number;
  totalPrayed: number;
  totalWithYou: number;
  totalComments: number;
}> {
  const supabase = await supabaseServer();
  const { data: posts } = await supabase
    .from("posts")
    .select("id")
    .eq("author_id", authorId);
  const postIds = (posts ?? []).map((p: any) => p.id);
  if (!postIds.length) return { postCount: 0, totalPrayed: 0, totalWithYou: 0, totalComments: 0 };

  const [reactionData, commentData] = await Promise.all([
    supabase.from("reactions").select("type").in("post_id", postIds),
    supabase.from("comments").select("id", { count: "exact", head: true }).in("post_id", postIds),
  ]);

  const reactions = reactionData.data ?? [];
  return {
    postCount: postIds.length,
    totalPrayed:   reactions.filter((r: any) => r.type === "PRAYED").length,
    totalWithYou:  reactions.filter((r: any) => r.type === "WITH_YOU").length,
    totalComments: commentData.count ?? 0,
  };
}

// =============================================================
// Theology Q&A
// =============================================================

function rowToTheologyQuestion(r: {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  users?: { id: string; name: string | null; role: string | null; bio: string | null; affiliation: string | null; created_at: string | null; avatar_url?: string | null } | null;
  theology_answers?: { count: number }[] | null;
}): TheologyQuestion {
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    content: r.content,
    category: r.category as TheologyCategory,
    createdAt: r.created_at,
    author: r.users ? rowToUser(r.users as any) : undefined,
    answerCount: r.theology_answers?.[0]?.count ?? 0,
  };
}

export async function listTheologyQuestions(opts: {
  category?: TheologyCategory;
  limit?: number;
} = {}): Promise<TheologyQuestion[]> {
  const supabase = await supabaseServer();
  let q = supabase
    .from("theology_questions")
    .select("*, users(id,name,role,bio,affiliation,created_at,avatar_url), theology_answers(count)")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 30);
  if (opts.category) q = q.eq("category", opts.category);
  const { data, error } = await q;
  if (error) { console.error("[listTheologyQuestions]", error.message); return []; }
  return (data ?? []).map((r: any) => rowToTheologyQuestion(r));
}

export async function getTheologyQuestionById(id: string, viewerId?: string | null): Promise<TheologyQuestion | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("theology_questions")
    .select("*, users(id,name,role,bio,affiliation,created_at,avatar_url), theology_answers(count)")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return rowToTheologyQuestion(data as any);
}

export async function createTheologyQuestion(input: {
  userId: string;
  title: string;
  content: string;
  category: TheologyCategory;
}): Promise<TheologyQuestion> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("theology_questions")
    .insert({ user_id: input.userId, title: input.title.trim(), content: input.content.trim(), category: input.category })
    .select("*, users(id,name,role,bio,affiliation,created_at,avatar_url), theology_answers(count)")
    .single();
  if (error) throw new Error(error.message);
  return rowToTheologyQuestion(data as any);
}

export async function deleteTheologyQuestion(id: string, userId: string): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.from("theology_questions").delete().eq("id", id).eq("user_id", userId);
}

export async function listTheologyAnswers(questionId: string, viewerId?: string | null): Promise<TheologyAnswer[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("theology_answers")
    .select("*, users(id,name,role,bio,affiliation,created_at,avatar_url), theology_answer_votes(count)")
    .eq("question_id", questionId)
    .order("is_accepted", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) return [];

  const rows = (data ?? []) as any[];
  if (!viewerId) return rows.map((r: any) => ({
    id: r.id, questionId: r.question_id, userId: r.user_id, content: r.content,
    isAccepted: r.is_accepted, createdAt: r.created_at,
    author: r.users ? rowToUser(r.users) : undefined,
    voteCount: r.theology_answer_votes?.[0]?.count ?? 0, hasVoted: false,
  }));

  const answerIds = rows.map((r: any) => r.id);
  const { data: votes } = await supabase
    .from("theology_answer_votes")
    .select("answer_id")
    .in("answer_id", answerIds)
    .eq("user_id", viewerId);
  const votedSet = new Set((votes ?? []).map((v: any) => v.answer_id));

  return rows.map((r: any) => ({
    id: r.id, questionId: r.question_id, userId: r.user_id, content: r.content,
    isAccepted: r.is_accepted, createdAt: r.created_at,
    author: r.users ? rowToUser(r.users) : undefined,
    voteCount: r.theology_answer_votes?.[0]?.count ?? 0,
    hasVoted: votedSet.has(r.id),
  }));
}

export async function createTheologyAnswer(questionId: string, userId: string, content: string): Promise<void> {
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("theology_answers")
    .insert({ question_id: questionId, user_id: userId, content: content.trim() });
  if (error) throw new Error(error.message);
}

export async function toggleTheologyAnswerVote(answerId: string, userId: string): Promise<"added" | "removed"> {
  const supabase = await supabaseServer();
  const { data: existing } = await supabase
    .from("theology_answer_votes")
    .select("id")
    .eq("answer_id", answerId)
    .eq("user_id", userId)
    .single();
  if (existing) {
    await supabase.from("theology_answer_votes").delete().eq("id", existing.id);
    return "removed";
  }
  await supabase.from("theology_answer_votes").insert({ answer_id: answerId, user_id: userId });
  return "added";
}

export async function acceptTheologyAnswer(answerId: string, questionId: string, questionOwnerId: string): Promise<void> {
  const supabase = await supabaseServer();
  // Unaccept all other answers first
  await supabase.from("theology_answers").update({ is_accepted: false }).eq("question_id", questionId);
  await supabase.from("theology_answers").update({ is_accepted: true }).eq("id", answerId);
}
