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
} from "@/lib/domain/types";
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

function rowToUser(r: { id: string; name: string | null; role: string | null; bio: string | null; affiliation: string | null; created_at: string | null; deactivated_at?: string | null; denomination?: string | null; faith_years?: number | null }): User {
  return {
    id: r.id,
    name: r.name ?? "",
    role: (r.role as UserRole) ?? "LAY",
    bio: r.bio ?? undefined,
    affiliation: r.affiliation ?? undefined,
    createdAt: r.created_at ?? new Date().toISOString(),
    deactivatedAt: r.deactivated_at ?? undefined,
    denomination: r.denomination ?? undefined,
    faithYears: r.faith_years ?? undefined,
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
    const { data, error } = await client.from("users").select("id, name, role, bio, affiliation, created_at, deactivated_at").in("id", ids);
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

export type ListFeedPostsPageParams = {
  currentUserId: string | null;
  scope: "ALL" | "FOLLOWING";
  limit: number;
  cursor?: { createdAt: string; id: string } | null;
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
  const [authorMap, reactionCountsMap, { data: reactionRows }] = await Promise.all([
    getAuthorMap(supabase, authorIds),
    getReactionCountsByPostIds(supabase, postIds),
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

const POSTS_INSERT_SELECT = "id, author_id, category, content, visibility, tags, created_at" as const;

export async function createPost(input: {
  authorId: string;
  category: DomainPost["category"];
  content: string;
  visibility?: DomainPost["visibility"];
  tags?: string[];
}): Promise<DomainPost> {
  const supabase = await supabaseServer();
  const tags = [...new Set((input.tags ?? []).map(normalizeTag).filter(Boolean))].slice(0, 5);
  const payload = {
    author_id: input.authorId,
    category: input.category,
    content: input.content.trim(),
    visibility: input.visibility ?? "MEMBERS",
    tags,
  };
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

export async function searchPeople(params: { q: string; viewerId: string }): Promise<User[]> {
  const tokens = tokenize(params.q);
  if (tokens.length === 0) return [];
  const supabase = await supabaseServer();
  const { data: rows } = await supabase.from("users").select("id, name, role, bio, affiliation, created_at, deactivated_at");
  if (!rows?.length) return [];
  const users = rows.map((r) => rowToUser(r));
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

export async function getUserById(id: string): Promise<User | null> {
  const r = await getUserByIdWithError(id);
  return r.user;
}

const USERS_SELECT_FULL = "id, name, role, bio, affiliation, created_at, deactivated_at, denomination, faith_years";
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

export async function createReport(params: {
  type: "REPORT_POST" | "REPORT_COMMENT";
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
