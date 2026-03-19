/**
 * Data access layer. Delegates to Supabase when DATA_MODE is "supabase", else in-memory.
 * All reads/writes go through this module—no direct imports of mock data elsewhere.
 */
import type {
  User,
  Post as DomainPost,
  PostWithAuthor,
  Comment,
  Reaction,
  ReactionType,
  UserRole,
  Ministry,
  Notification,
  ModerationAction,
  ModerationActionType,
  Note,
  NoteType,
  Cell,
  CellMessage,
  CellType,
} from "@/lib/domain/types";
import { getSeedData, ministries } from "@/lib/data/mock";
import { getSession } from "@/lib/auth/session";
import { tokenize, sortByScore } from "@/lib/search";
import { createLocalAdapter } from "@/lib/storage/localAdapter";
import { DATA_MODE } from "@/lib/data/repositoryMode";
import * as supabaseRepo from "@/lib/data/supabaseRepository";

type FollowEntry = { followerId: string; followingId: string; createdAt: string };
type BlockEntry = { blockerId: string; blockedId: string };
type MuteEntry = { muterId: string; mutedId: string };

const usersAdapter = createLocalAdapter<User[]>("users");
const postsAdapter = createLocalAdapter<DomainPost[]>("posts");
const commentsAdapter = createLocalAdapter<Comment[]>("comments");
const followsAdapter = createLocalAdapter<FollowEntry[]>("follows");
const reactionsAdapter = createLocalAdapter<Reaction[]>("reactions");
const notificationsAdapter = createLocalAdapter<Notification[]>("notifications");
const blocksAdapter = createLocalAdapter<BlockEntry[]>("blocks");
const mutesAdapter = createLocalAdapter<MuteEntry[]>("mutes");
const moderationActionsAdapter = createLocalAdapter<ModerationAction[]>("moderation_actions");
const notesAdapter = createLocalAdapter<Note[]>("notes");

let users: User[] = [];
let posts: DomainPost[] = [];
let comments: Comment[] = [];
let follows: FollowEntry[] = [];
let reactions: Reaction[] = [];
let blocks: BlockEntry[] = [];
let mutes: MuteEntry[] = [];
let moderationActions: ModerationAction[] = [];
let notes: Note[] = [];
let notifications: Notification[] = [];

function loadOrSeed<T>(
  adapter: { load(): T | null },
  seed: T,
  validate: (x: unknown) => x is T
): T {
  if (typeof window === "undefined") return seed;
  const loaded = adapter.load();
  if (loaded != null && validate(loaded)) return loaded;
  return seed;
}

function initRepository(): void {
  const seed = getSeedData();
  users = loadOrSeed(usersAdapter, seed.users, (x): x is User[] => Array.isArray(x));
  posts = loadOrSeed(postsAdapter, seed.posts, (x): x is DomainPost[] => Array.isArray(x));
  comments = loadOrSeed(commentsAdapter, seed.comments, (x): x is Comment[] => Array.isArray(x));
  follows = loadOrSeed(followsAdapter, seed.follows as FollowEntry[], (x): x is FollowEntry[] => Array.isArray(x));
  reactions = loadOrSeed(reactionsAdapter, seed.reactions, (x): x is Reaction[] => Array.isArray(x));
  notifications = loadOrSeed(notificationsAdapter, seed.notifications, (x): x is Notification[] => Array.isArray(x));
  blocks = loadOrSeed(blocksAdapter, [], (x): x is BlockEntry[] => Array.isArray(x));
  mutes = loadOrSeed(mutesAdapter, [], (x): x is MuteEntry[] => Array.isArray(x));
  moderationActions = loadOrSeed(moderationActionsAdapter, [], (x): x is ModerationAction[] => Array.isArray(x));
  notes = loadOrSeed(notesAdapter, [], (x): x is Note[] => Array.isArray(x));
}

initRepository();

function persistAll(): void {
  if (typeof window === "undefined") return;
  usersAdapter.save(users);
  postsAdapter.save(posts);
  commentsAdapter.save(comments);
  followsAdapter.save(follows);
  reactionsAdapter.save(reactions);
  notificationsAdapter.save(notifications);
  blocksAdapter.save(blocks);
  mutesAdapter.save(mutes);
  moderationActionsAdapter.save(moderationActions);
  notesAdapter.save(notes);
}

/** Reset to seed data and persist. For dev/testing only. */
export function resetRepository(): void {
  const seed = getSeedData();
  users = seed.users.map((u) => ({ ...u }));
  posts = seed.posts.map((p) => ({ ...p, tags: (p as DomainPost).tags ?? [] }));
  comments = [...seed.comments];
  follows = seed.follows.map((f) => ({ ...f }));
  reactions = [...seed.reactions];
  notifications = [...seed.notifications];
  blocks = [];
  mutes = [];
  moderationActions = [];
  notes = [];
  persistAll();
}

/**
 * Current user: session → users row only. Returns null when not logged in or no profile.
 *
 * 성능 개선 포인트:
 * - 기존 코드는 매 요청마다 ensureProfile()를 실행했음.
 *   ensureProfile은 내부적으로 users 테이블에 upsert를 시도하는 쓰기 연산으로,
 *   일반 페이지 요청에서 불필요한 DB 왕복을 유발했음.
 * - ensureProfile은 인증 직후(verify-magic, onboarding)에만 실행되어야 함.
 *   session.ts의 getSession() 비쿠키 경로에서 이미 ensureProfile을 호출하므로
 *   여기서 중복 실행할 필요 없음.
 * - 일반 페이지 요청은 쿠키 → admin client read 2단계로 완료.
 *
 * TODO: Next.js `cache()` / React `cache()` wrapping 고려 — 같은 요청 내
 *   여러 Server Component가 getCurrentUser()를 각자 호출할 때 중복 쿼리를 방지.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!useSupabaseAuth()) return null;
  try {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const supabase = await supabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (!user?.id) return null;
    // Admin client bypasses RLS — no auth.uid() dependency, always resolves the row.
    const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
    const admin = getSupabaseAdmin();
    const queryClient = admin ?? supabase;

    const { data: row } = await queryClient
      .from("users")
      .select("id, name, role, bio, affiliation, created_at, deactivated_at")
      .eq("id", user.id)
      .single();
    if (!row) return null;
    return {
      id: row.id,
      name: row.name ?? "",
      role: (row.role as UserRole) ?? "LAY",
      bio: row.bio ?? undefined,
      affiliation: row.affiliation ?? undefined,
      createdAt: row.created_at ?? new Date().toISOString(),
      deactivatedAt: row.deactivated_at ?? undefined,
    };
  } catch {
    return null;
  }
}

/**
 * 인증 직후(온보딩/verify-magic) 등 프로필 행이 없을 수 있는 시점에만 호출.
 * 일반 페이지 요청에서 getCurrentUser() 대신 이 함수를 직접 쓰지 말 것.
 * session.ts의 getSession() 비쿠키 경로가 이미 ensureProfile을 실행하므로
 * 대부분의 경우 이 함수는 불필요함.
 */
export async function ensureCurrentUserProfile(): Promise<void> {
  if (!useSupabaseAuth()) return;
  try {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const supabase = await supabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (!user?.id) return;
    const { ensureProfile } = await import("@/lib/auth/ensureProfile");
    await ensureProfile({ userId: user.id, email: user.email ?? null });
  } catch {
    // non-critical: best-effort
  }
}

function useSupabaseAuth(): boolean {
  return Boolean(
    typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function getUserById(id: string): Promise<User | null> {
  if (DATA_MODE === "supabase") return supabaseRepo.getUserById(id);
  return users.find((u) => u.id === id) ?? null;
}

/** For profile page: returns user and error message when fetch fails (no notFound). */
export async function getProfileWithError(id: string): Promise<{ user: User | null; errorMessage: string | null }> {
  if (DATA_MODE === "supabase") return supabaseRepo.getUserByIdWithError(id);
  const u = users.find((u) => u.id === id) ?? null;
  return { user: u, errorMessage: null };
}

/** Soft-deactivate account (Supabase only). Sets deactivated_at and hides user's posts. Caller should sign out after. */
export async function deactivateUser(userId: string): Promise<void> {
  if (DATA_MODE === "supabase") return supabaseRepo.deactivateUser(userId);
  throw new Error("Deactivation is not available in memory mode");
}

/** Restore account within 7 days (Supabase only). Clears deactivated_at and unhides user's posts. */
export async function restoreUser(userId: string): Promise<{ ok: boolean; error?: string }> {
  if (DATA_MODE === "supabase") return supabaseRepo.restoreUser(userId);
  return { ok: false, error: "Restore is not available in memory mode" };
}

/** Update own profile fields (name, bio, church, denomination, etc.). */
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
  if (DATA_MODE === "supabase") return supabaseRepo.updateUserProfile(userId, data);
  return { error: "Profile update is not available in memory mode" };
}

/** Suggest people the user might want to follow (same role, not yet following). */
export async function suggestPeopleToFollow(params: {
  currentUserId: string;
  role: UserRole;
  limit?: number;
}): Promise<User[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.suggestPeopleToFollow(params);
  return [];
}

/** Create user profile in Supabase public.users. Call after magic-link auth when completing onboarding (e.g. bypass flow). */
export async function createUserProfileInSupabase(
  authUserId: string,
  data: { name: string; role: UserRole; bio?: string; affiliation?: string }
): Promise<User> {
  const user: User = {
    id: authUserId,
    name: data.name,
    role: data.role,
    bio: data.bio,
    affiliation: data.affiliation,
    createdAt: new Date().toISOString(),
  };
  if (useSupabaseAuth()) {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const supabase = await supabaseServer();
    const { error } = await supabase.from("users").insert({
      id: authUserId,
      name: data.name,
      role: data.role,
      bio: data.bio ?? null,
      affiliation: data.affiliation ?? null,
      created_at: user.createdAt,
    });
    if (error) throw new Error(error.message);
  }
  users.push(user);
  persistAll();
  return user;
}

/** Normalize tag for storage: trim, lowercase, collapse spaces. */
export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Unique tags from all posts (normalized). */
export async function listAllTags(): Promise<string[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listAllTags();
  return listAllTagsSync();
}

function listAllTagsSync(): string[] {
  const set = new Set<string>();
  posts.forEach((p) => (p.tags ?? []).forEach((t) => set.add(t)));
  return Array.from(set).sort();
}

/** Tags with sample count for ordering; do not show count in UI. */
export async function listPopularTags(limit = 20): Promise<{ tag: string; sampleCount: number }[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listPopularTags(limit);
  const counts = new Map<string, number>();
  const list = Array.isArray(posts) ? posts : [];
  list.forEach((p) =>
    (p.tags ?? []).forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1))
  );
  return Array.from(counts.entries())
    .map(([tag, sampleCount]) => ({ tag, sampleCount }))
    .sort((a, b) => b.sampleCount - a.sampleCount)
    .slice(0, limit);
}

const SEARCH_MAX_RESULTS = 30;

/** Search posts by content, tags, author name. Applies canViewPost + block/mute. Returns top 30. */
export async function searchPosts(params: {
  q: string;
  currentUserId: string;
  scope?: "ALL" | "FOLLOWING";
}): Promise<PostWithAuthor[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.searchPosts(params);
  const session = await getSession();
  const uid = params.currentUserId ?? session?.userId ?? null;
  if (!uid) return [];
  const tokens = tokenize(params.q);
  if (tokens.length === 0) return [];

  let source = [...posts];
  if (params.scope === "FOLLOWING") {
    const followingIds = await listFollowingIds(uid);
    source = source.filter((p) => followingIds.includes(p.authorId));
  }
  const withAuthor = source.map((p) => toPostWithAuthor(p, uid));
  const { canViewPost } = await import("@/lib/domain/guards");
  const visible = withAuthor.filter((post) => {
    if (isBlocked(uid, post.authorId) || isMuted(uid, post.authorId)) return false;
    const user = users.find((u) => u.id === uid);
    return user && canViewPost(post, user, (a, b) => follows.some((f) => f.followerId === a && f.followingId === b));
  });

  const getSearchText = (post: PostWithAuthor) =>
    [post.content, (post.tags ?? []).join(" "), post.author.name].join(" ");
  const sorted = sortByScore(visible, getSearchText, tokens);
  return sorted.slice(0, SEARCH_MAX_RESULTS);
}

/** Search people by name, affiliation, bio. Excludes blocked (both directions). Top 30. */
export async function searchPeople(params: { q: string; viewerId: string; role?: string; denomination?: string }): Promise<User[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.searchPeople(params);
  const tokens = tokenize(params.q);
  if (tokens.length === 0) return [];

  const filtered = users.filter((u) => {
    if (isBlocked(params.viewerId, u.id) || isBlocked(u.id, params.viewerId)) return false;
    return true;
  });
  const getSearchText = (u: User) =>
    [u.name, u.affiliation ?? "", u.bio ?? ""].join(" ");
  const sorted = sortByScore(filtered, getSearchText, tokens);
  return sorted.slice(0, SEARCH_MAX_RESULTS);
}

/** Search tags by string match. From listAllTags(); top 30. */
export async function searchTags(q: string): Promise<string[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.searchTags(q);
  const tokens = tokenize(q);
  if (tokens.length === 0) return [];

  const all = listAllTagsSync();
  const sorted = sortByScore(all, (tag) => tag, tokens);
  return sorted.slice(0, SEARCH_MAX_RESULTS);
}

/** Posts with this tag; respects visibility, block/mute, scope. Newest-first. */
export async function listPostsByTag(
  normalizedTag: string,
  params?: { currentUserId?: string | null; scope?: "ALL" | "FOLLOWING" }
): Promise<PostWithAuthor[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listPostsByTag(normalizedTag, params);
  const session = await getSession();
  const uid = params?.currentUserId ?? session?.userId ?? null;
  let source = posts.filter((p) => (p.tags ?? []).includes(normalizedTag));
  if (params?.scope === "FOLLOWING" && uid) {
    const followingIds = await listFollowingIds(uid);
    source = source.filter((p) => followingIds.includes(p.authorId));
  }
  const sorted = source.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const withAuthor = sorted.map((p) => toPostWithAuthor(p, uid));
  if (!uid) return withAuthor;
  const { canViewPost } = await import("@/lib/domain/guards");
  return withAuthor.filter((post) => {
    if (isBlocked(uid, post.authorId) || isMuted(uid, post.authorId)) return false;
    const user = users.find((u) => u.id === uid);
    return user && canViewPost(post, user, (a, b) => follows.some((f) => f.followerId === a && f.followingId === b));
  });
}

/** Create post (Write page). Mutates same `posts` array that listFeedPosts reads. Normalizes tags. */
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
  if (DATA_MODE === "supabase") return supabaseRepo.createPost(input);
  const id = `p${Date.now()}`;
  const now = new Date().toISOString();
  const rawTags = input.tags ?? [];
  const tags = [...new Set(rawTags.map(normalizeTag).filter(Boolean))].slice(0, 5);
  const post: DomainPost = {
    id,
    authorId: input.authorId,
    category: input.category,
    content: input.content.trim(),
    visibility: input.visibility ?? "MEMBERS",
    tags,
    createdAt: now,
  };
  posts.push(post);
  persistAll();
  return post;
}

export async function updatePost(
  postId: string,
  actorId: string,
  input: { content?: string; category?: DomainPost["category"]; visibility?: DomainPost["visibility"]; tags?: string[] }
): Promise<DomainPost | null> {
  if (DATA_MODE === "supabase") return supabaseRepo.updatePost(postId, actorId, input);
  const p = posts.find((x) => x.id === postId);
  if (!p || p.authorId !== actorId) return null;
  if (input.content !== undefined) p.content = input.content.trim();
  if (input.category !== undefined) p.category = input.category;
  if (input.visibility !== undefined) p.visibility = input.visibility;
  if (input.tags !== undefined) p.tags = [...new Set(input.tags.map(normalizeTag).filter(Boolean))].slice(0, 5);
  persistAll();
  return p;
}

export async function deletePost(postId: string, actorId: string): Promise<boolean> {
  if (DATA_MODE === "supabase") return supabaseRepo.deletePost(postId, actorId);
  const i = posts.findIndex((x) => x.id === postId);
  if (i < 0 || posts[i].authorId !== actorId) return false;
  posts.splice(i, 1);
  persistAll();
  return true;
}

// --------------------------------
// Cell chat system functions
// --------------------------------

export async function listOpenCells(): Promise<Cell[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listOpenCells();
  return [];
}

export async function createCell(input: {
  creatorId: string;
  type: CellType;
  title: string;
  topicTags?: string[];
}): Promise<Cell> {
  if (DATA_MODE === "supabase") return supabaseRepo.createCell(input);
  throw new Error("createCell not available in memory mode");
}

export async function joinCell(cellId: string, userId: string): Promise<void> {
  if (DATA_MODE === "supabase") return supabaseRepo.joinCell(cellId, userId);
  throw new Error("joinCell not available in memory mode");
}

export async function leaveCell(cellId: string, userId: string): Promise<void> {
  if (DATA_MODE === "supabase") return supabaseRepo.leaveCell(cellId, userId);
  throw new Error("leaveCell not available in memory mode");
}

export async function getCellMessages(cellId: string, limit = 50): Promise<CellMessage[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.getCellMessages(cellId, limit);
  return [];
}

export async function postCellMessage(cellId: string, authorId: string, content: string): Promise<CellMessage> {
  if (DATA_MODE === "supabase") return supabaseRepo.postCellMessage(cellId, authorId, content);
  throw new Error("postCellMessage not available in memory mode");
}

/** Fetch a single cell by id. */
export async function getCellById(cellId: string): Promise<Cell | null> {
  if (DATA_MODE === "supabase") return supabaseRepo.getCellById(cellId);
  return null;
}

/** Check whether a user is a member of a cell (or if the cell is open). */
export async function isMember(cellId: string, userId: string): Promise<boolean> {
  if (DATA_MODE === "supabase") return supabaseRepo.isMember(cellId, userId);
  return false;
}

/** Build PostWithAuthor from domain Post and current user's reactions + counts. */
function toPostWithAuthor(post: DomainPost, currentUserId: string | null): PostWithAuthor {
  const author = users.find((u) => u.id === post.authorId);
  if (!author) throw new Error(`Author ${post.authorId} not found for post ${post.id}`);
  const postReactions = reactions.filter((r) => r.postId === post.id);
  const userReactions = currentUserId ? postReactions.filter((r) => r.userId === currentUserId) : [];
  const prayed = userReactions.some((r) => r.type === "PRAYED");
  const withYou = userReactions.some((r) => r.type === "WITH_YOU");
  const reactionCounts = {
    prayed: postReactions.filter((r) => r.type === "PRAYED").length,
    withYou: postReactions.filter((r) => r.type === "WITH_YOU").length,
  };
  const commentCount = comments.filter((c) => c.postId === post.id).length;
  return {
    ...post,
    tags: post.tags ?? [],
    author,
    reactionsByCurrentUser: { prayed, withYou },
    reactionCounts,
    commentCount,
  };
}

/** Feed posts, chronological. scope FOLLOWING = only posts by users current user follows. */
export async function listFeedPosts(options: {
  scope: "ALL" | "FOLLOWING";
  currentUserId?: string | null;
}): Promise<PostWithAuthor[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listFeedPosts(options);
  const session = await getSession();
  const uid = options.currentUserId ?? session?.userId ?? null;
  let source = [...posts];
  if (options.scope === "FOLLOWING" && uid) {
    const followingIds = listFollowingIdsSync(uid);
    source = source.filter((p) => followingIds.includes(p.authorId));
  }
  const sorted = source.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return sorted.map((p) => toPostWithAuthor(p, uid));
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
  error?: string;
};

/** Paginated feed; same visibility/scope as listFeedPosts. */
export async function listFeedPostsPage(params: ListFeedPostsPageParams): Promise<ListFeedPostsPageResult> {
  if (DATA_MODE === "supabase") return supabaseRepo.listFeedPostsPage(params);
  const session = await getSession();
  const uid = params.currentUserId ?? session?.userId ?? null;
  let source = [...posts];
  if (params.scope === "FOLLOWING" && uid) {
    const followingIds = listFollowingIdsSync(uid);
    source = source.filter((p) => followingIds.includes(p.authorId));
  }
  const sorted = source.sort((a, b) => {
    const t = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (t !== 0) return t;
    return b.id.localeCompare(a.id);
  });
  let start = 0;
  if (params.cursor?.createdAt != null && params.cursor?.id != null) {
    const idx = sorted.findIndex(
      (p) => p.createdAt === params.cursor!.createdAt && p.id === params.cursor!.id
    );
    if (idx >= 0) start = idx + 1;
  }
  const limit = Math.min(Math.max(params.limit || 20, 1), 100);
  const slice = sorted.slice(start, start + limit + 1);
  const items = slice.slice(0, limit).map((p) => toPostWithAuthor(p, uid));
  const nextCursor =
    slice.length > limit && slice[limit]
      ? { createdAt: slice[limit].createdAt, id: slice[limit].id }
      : null;
  return { items, nextCursor };
}

export async function getPostById(id: string): Promise<PostWithAuthor | null> {
  if (DATA_MODE === "supabase") return supabaseRepo.getPostById(id);
  const post = posts.find((p) => p.id === id);
  if (!post) return null;
  const session = await getSession();
  return toPostWithAuthor(post, session?.userId ?? null);
}

/** Posts by author for profile page, chronological. */
export async function listPostsByAuthorId(authorId: string): Promise<PostWithAuthor[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listPostsByAuthorId(authorId);
  const session = await getSession();
  const uid = session?.userId ?? null;
  const byAuthor = posts.filter((p) => p.authorId === authorId);
  const sorted = byAuthor.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return sorted.map((p) => toPostWithAuthor(p, uid));
}

export async function listPostsByAuthorIdPaged(params: {
  authorId: string;
  limit: number;
  offset: number;
}): Promise<{ items: PostWithAuthor[]; hasMore: boolean }> {
  if (DATA_MODE === "supabase") return supabaseRepo.listPostsByAuthorIdPaged(params);
  const session = await getSession();
  const uid = session?.userId ?? null;
  const sorted = posts
    .filter((p) => p.authorId === params.authorId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const page = sorted.slice(params.offset, params.offset + params.limit);
  const hasMore = sorted.length > params.offset + params.limit;
  return { items: page.map((p) => toPostWithAuthor(p, uid)), hasMore };
}

/** Comments for a post, stable order: top-level first, then replies by createdAt. */
export async function listCommentsByPostId(postId: string): Promise<(Comment & { author: User })[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listCommentsByPostId(postId);
  const list = comments
    .filter((c) => c.postId === postId)
    .sort((a, b) => {
      const aRoot = a.parentId ? 1 : 0;
      const bRoot = b.parentId ? 1 : 0;
      if (aRoot !== bRoot) return aRoot - bRoot;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  return list.map((c) => {
    const author = users.find((u) => u.id === c.authorId);
    if (!author) throw new Error(`Author ${c.authorId} not found for comment ${c.id}`);
    return { ...c, author } as Comment & { author: User };
  });
}

/** Add comment; notifies post author if commenter is not the author. Threading: parentId allowed only for top-level (1 level). */
export async function addComment(input: {
  postId: string;
  authorId: string;
  content: string;
  parentId?: string;
}): Promise<Comment> {
  if (DATA_MODE === "supabase") return supabaseRepo.addComment(input);
  const post = posts.find((p) => p.id === input.postId);
  if (!post) throw new Error(`Post ${input.postId} not found`);
  let parentId: string | undefined;
  if (input.parentId) {
    const parent = comments.find((c) => c.id === input.parentId && c.postId === input.postId);
    if (!parent || parent.parentId) parentId = undefined; // only allow reply to top-level
    else parentId = parent.id;
  }
  const id = `c${Date.now()}`;
  const comment: Comment = {
    id,
    postId: input.postId,
    authorId: input.authorId,
    content: input.content.trim(),
    createdAt: new Date().toISOString(),
    parentId,
  };
  comments.push(comment);
  if (post.authorId !== input.authorId) {
    createNotification({
      type: "COMMENTED_ON_YOUR_POST",
      recipientId: post.authorId,
      actorId: input.authorId,
      postId: input.postId,
      createdAt: comment.createdAt,
    });
  }
  persistAll();
  return comment;
}

/** Delete comment; returns true only if actor is the comment author. */
export async function deleteComment(commentId: string, actorId: string): Promise<boolean> {
  if (DATA_MODE === "supabase") return supabaseRepo.deleteComment(commentId, actorId);
  const i = comments.findIndex((c) => c.id === commentId);
  if (i < 0) return false;
  if (comments[i].authorId !== actorId) return false;
  comments.splice(i, 1);
  persistAll();
  return true;
}

export async function updateComment(commentId: string, actorId: string, content: string): Promise<Comment | null> {
  if (DATA_MODE === "supabase") return supabaseRepo.updateComment(commentId, actorId, content);
  const c = comments.find((x) => x.id === commentId);
  if (!c || c.authorId !== actorId) return null;
  const trimmed = content.trim();
  if (!trimmed) return null;
  c.content = trimmed;
  persistAll();
  return c;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (DATA_MODE === "supabase") return supabaseRepo.isFollowing(followerId, followingId);
  return follows.some((f) => f.followerId === followerId && f.followingId === followingId);
}

export async function listFollowingIds(userId: string): Promise<string[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listFollowingIds(userId);
  return listFollowingIdsSync(userId);
}

function listFollowingIdsSync(userId: string): string[] {
  return follows.filter((f) => f.followerId === userId).map((f) => f.followingId);
}

export async function listFollowerIds(userId: string): Promise<string[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listFollowerIds(userId);
  return follows.filter((f) => f.followingId === userId).map((f) => f.followerId);
}

export async function listFollowers(userId: string): Promise<User[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listFollowers(userId);
  const ids = follows
    .filter((f) => f.followingId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((f) => f.followerId);
  return ids.map((id) => users.find((u) => u.id === id)).filter((u): u is User => u != null);
}

export async function listFollowing(userId: string): Promise<User[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listFollowing(userId);
  const ids = follows
    .filter((f) => f.followerId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((f) => f.followingId);
  return ids.map((id) => users.find((u) => u.id === id)).filter((u): u is User => u != null);
}

export async function listFollowingWithNames(userId: string): Promise<{ id: string; name: string }[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listFollowingWithNames(userId);
  return [];
}

/** Toggle follow; in-memory only. Creates FOLLOWED_YOU notification when now following. */
export async function toggleFollow(followerId: string, followingId: string): Promise<boolean> {
  if (DATA_MODE === "supabase") return supabaseRepo.toggleFollow(followerId, followingId);
  const i = follows.findIndex((f) => f.followerId === followerId && f.followingId === followingId);
  if (i >= 0) {
    follows.splice(i, 1);
    persistAll();
    return false;
  }
  follows.push({
    followerId,
    followingId,
    createdAt: new Date().toISOString(),
  });
  createNotification({
    type: "FOLLOWED_YOU",
    recipientId: followingId,
    actorId: followerId,
    createdAt: new Date().toISOString(),
  });
  persistAll();
  return true;
}

/** Toggle reaction. Returns { reacted: true } if added, { reacted: false } if removed. Notifies on first add only. */
export async function toggleReaction(postId: string, userId: string, type: ReactionType): Promise<{ reacted: boolean }> {
  if (DATA_MODE === "supabase") return supabaseRepo.toggleReaction(postId, userId, type);
  const i = reactions.findIndex((r) => r.postId === postId && r.userId === userId && r.type === type);
  const post = posts.find((p) => p.id === postId);
  if (i >= 0) {
    reactions.splice(i, 1);
    persistAll();
    return { reacted: false };
  }
  const createdAt = new Date().toISOString();
  reactions.push({ postId, userId, type, createdAt });
  if (post && post.authorId !== userId) {
    createNotification({
      type: "REACTED_TO_YOUR_POST",
      recipientId: post.authorId,
      actorId: userId,
      postId,
      createdAt,
    });
  }
  persistAll();
  return { reacted: true };
}

export async function getReactors(postId: string, type: ReactionType): Promise<User[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.getReactors(postId, type);
  const reactorIds = reactions
    .filter((r) => r.postId === postId && r.type === type)
    .map((r) => r.userId);
  return reactorIds.map((id) => users.find((u) => u.id === id)).filter((u): u is User => u != null);
}

/** Create notification (id generated). Used by follow/comment/reaction flows. */
function createNotification(n: Omit<Notification, "id">): Notification {
  const id = `n${Date.now()}`;
  const notification: Notification = { ...n, id };
  notifications.push(notification);
  persistAll();
  return notification;
}

export async function listNotifications(recipientId: string): Promise<Notification[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listNotifications(recipientId);
  return [...notifications]
    .filter((n) => n.recipientId === recipientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Unread count for header badge. recipient_id = userId and read_at is null / !readAt. */
export async function countUnreadNotifications(userId: string): Promise<number> {
  if (DATA_MODE === "supabase") return supabaseRepo.countUnreadNotifications(userId);
  return notifications.filter((n) => n.recipientId === userId && !n.readAt).length;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  if (DATA_MODE === "supabase") return supabaseRepo.markNotificationRead(notificationId);
  const n = notifications.find((x) => x.id === notificationId);
  if (n) n.readAt = new Date().toISOString();
  persistAll();
}

export async function markAllNotificationsRead(recipientId: string): Promise<void> {
  if (DATA_MODE === "supabase") return supabaseRepo.markAllNotificationsRead(recipientId);
  const now = new Date().toISOString();
  notifications.forEach((n) => {
    if (n.recipientId === recipientId && !n.readAt) n.readAt = now;
  });
  persistAll();
}

export function createModerationAction(action: Omit<ModerationAction, "id" | "createdAt">): void {
  moderationActions.push({
    ...action,
    id: `ma${Date.now()}`,
    createdAt: new Date().toISOString(),
  });
  persistAll();
}

/** Create a moderation report (Supabase: public.moderation_reports; memory: createModerationAction). */
export async function createReport(params: {
  type: "REPORT_POST" | "REPORT_COMMENT" | "REPORT_USER";
  reporterId: string;
  postId?: string;
  commentId?: string;
  reason?: string;
  targetUserId?: string;
}): Promise<void> {
  if (DATA_MODE === "supabase") {
    await supabaseRepo.createReport(params);
    return;
  }
  createModerationAction({
    type: params.type,
    actorId: params.reporterId,
    postId: params.postId,
    commentId: params.commentId,
    reason: params.reason,
    targetUserId: params.targetUserId,
  });
}

/** Get comment author id (for report targetUserId). */
export async function getCommentAuthorId(commentId: string): Promise<string | null> {
  if (DATA_MODE === "supabase") return supabaseRepo.getCommentAuthorId(commentId);
  const c = comments.find((x) => x.id === commentId);
  return c?.authorId ?? null;
}

// ----- Notes (private, My Space; never in feed/search) -----

export async function listNotesByType(params: {
  userId: string;
  type: NoteType;
  limit?: number;
}): Promise<Note[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listNotesByType(params);
  return notes
    .filter((n) => n.userId === params.userId && n.type === params.type && !n.isArchived)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, params.limit ?? 50);
}

export async function hasNoteOfTypeToday(params: {
  userId: string;
  type: "PRAYER" | "GRATITUDE";
}): Promise<boolean> {
  if (DATA_MODE === "supabase") return supabaseRepo.hasNoteOfTypeToday(params);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const startOfToday = start.toISOString();
  return notes.some(
    (n) =>
      n.userId === params.userId &&
      n.type === params.type &&
      !n.isArchived &&
      n.createdAt >= startOfToday
  );
}

export async function createNote(params: {
  userId: string;
  type: NoteType;
  title?: string;
  content: string;
  tags?: string[];
}): Promise<Note> {
  if (DATA_MODE === "supabase") return supabaseRepo.createNote(params);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const tags = (params.tags ?? []).slice(0, 5).map((t) => t.trim().toLowerCase()).filter(Boolean);
  const note: Note = {
    id,
    userId: params.userId,
    type: params.type,
    title: params.title?.trim(),
    content: params.content.trim(),
    tags,
    shareToProfile: false,
    createdAt: now,
    updatedAt: now,
  };
  notes.push(note);
  persistAll();
  return note;
}

export async function updateNote(params: {
  userId: string;
  noteId: string;
  title?: string;
  content?: string;
  tags?: string[];
  isArchived?: boolean;
}): Promise<Note | null> {
  if (DATA_MODE === "supabase") return supabaseRepo.updateNote(params);
  const idx = notes.findIndex((n) => n.id === params.noteId && n.userId === params.userId);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  if (params.title !== undefined) notes[idx].title = params.title.trim() || undefined;
  if (params.content !== undefined) notes[idx].content = params.content.trim();
  if (params.tags !== undefined) notes[idx].tags = params.tags.slice(0, 5).map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (params.isArchived !== undefined) notes[idx].isArchived = params.isArchived;
  notes[idx].updatedAt = now;
  persistAll();
  return notes[idx];
}

export async function deleteNote(params: { userId: string; noteId: string }): Promise<boolean> {
  if (DATA_MODE === "supabase") return supabaseRepo.deleteNote(params);
  const idx = notes.findIndex((n) => n.id === params.noteId && n.userId === params.userId);
  if (idx < 0) return false;
  notes.splice(idx, 1);
  persistAll();
  return true;
}

export async function getNoteById(params: { userId: string; noteId: string }): Promise<Note | null> {
  if (DATA_MODE === "supabase") return supabaseRepo.getNoteById(params);
  const n = notes.find((x) => x.id === params.noteId && x.userId === params.userId);
  return n ?? null;
}

export async function listSharedNotesByUserId(params: {
  userId: string;
  type?: NoteType;
  limit?: number;
}): Promise<Note[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listSharedNotesByUserId(params);
  return notes
    .filter(
      (n) =>
        n.userId === params.userId &&
        n.shareToProfile === true &&
        !n.isArchived &&
        (params.type == null || n.type === params.type)
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, params.limit ?? 50);
}

export async function listSharedNotesByUserIdPaged(params: {
  userId: string;
  limit: number;
  offset: number;
}): Promise<{ items: Note[]; hasMore: boolean }> {
  if (DATA_MODE === "supabase") return supabaseRepo.listSharedNotesByUserIdPaged(params);
  const sorted = notes
    .filter((n) => n.userId === params.userId && n.shareToProfile === true && !n.isArchived)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const page = sorted.slice(params.offset, params.offset + params.limit);
  const hasMore = sorted.length > params.offset + params.limit;
  return { items: page, hasMore };
}

export async function toggleShareToProfile(params: {
  userId: string;
  noteId: string;
  value: boolean;
}): Promise<boolean> {
  if (DATA_MODE === "supabase") return supabaseRepo.toggleShareToProfile(params);
  const idx = notes.findIndex((n) => n.id === params.noteId && n.userId === params.userId);
  if (idx < 0) return false;
  notes[idx].shareToProfile = params.value;
  notes[idx].updatedAt = new Date().toISOString();
  persistAll();
  return true;
}

export async function publishNoteToCommunity(params: {
  userId: string;
  noteId: string;
}): Promise<{ postId: string }> {
  if (DATA_MODE === "supabase") return supabaseRepo.publishNoteToCommunity(params);
  const idx = notes.findIndex((n) => n.id === params.noteId && n.userId === params.userId);
  if (idx < 0) throw new Error("Note not found");
  const note = notes[idx];
  if (note.publishedPostId) return { postId: note.publishedPostId };
  const post = await createPost({
    authorId: params.userId,
    category: "TESTIMONY",
    content: note.content,
    visibility: "MEMBERS",
    tags: note.tags ?? [],
  });
  notes[idx].publishedPostId = post.id;
  notes[idx].updatedAt = new Date().toISOString();
  persistAll();
  return { postId: post.id };
}

export async function updatePrayerAnswer(params: {
  userId: string;
  noteId: string;
  answerNote: string;
}): Promise<boolean> {
  if (DATA_MODE === "supabase") return supabaseRepo.updatePrayerAnswer(params);
  const idx = notes.findIndex((n) => n.id === params.noteId && n.userId === params.userId);
  if (idx < 0) return false;
  const note = notes[idx];
  if (note.type !== "PRAYER" || note.status !== "ANSWERED") return false;
  notes[idx].answerNote = params.answerNote.trim() || undefined;
  notes[idx].updatedAt = new Date().toISOString();
  persistAll();
  return true;
}

export async function publishPrayerAsTestimony(params: {
  userId: string;
  noteId: string;
}): Promise<{ postId: string } | null> {
  if (DATA_MODE === "supabase") return supabaseRepo.publishPrayerAsTestimony(params);
  const idx = notes.findIndex((n) => n.id === params.noteId && n.userId === params.userId);
  if (idx < 0) return null;
  const note = notes[idx];
  if (
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
  notes[idx].publishedPostId = post.id;
  notes[idx].updatedAt = new Date().toISOString();
  persistAll();
  return { postId: post.id };
}

export interface MySpaceOverview {
  activePrayers: number;
  answeredPrayers: number;
  gratitudeThisWeek: number;
  lastReflection: string | null;
}

export async function getMySpaceOverview(userId: string): Promise<MySpaceOverview> {
  if (DATA_MODE === "supabase") return supabaseRepo.getMySpaceOverview(userId);
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const userNotes = notes.filter((n) => n.userId === userId && !n.isArchived);
  const activePrayers = userNotes.filter(
    (n) => n.type === "PRAYER" && (n.status === undefined || n.status === "ONGOING")
  ).length;
  const answeredPrayers = userNotes.filter(
    (n) => n.type === "PRAYER" && n.status === "ANSWERED"
  ).length;
  const gratitudeThisWeek = userNotes.filter(
    (n) => n.type === "GRATITUDE" && n.createdAt >= sevenDaysAgo
  ).length;
  const sorted = [...userNotes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const lastReflection = sorted[0]?.createdAt ?? null;
  return {
    activePrayers,
    answeredPrayers,
    gratitudeThisWeek,
    lastReflection,
  };
}

export function isBlocked(viewerId: string, targetUserId: string): boolean {
  return blocks.some((b) => b.blockerId === viewerId && b.blockedId === targetUserId);
}

export function toggleBlock(viewerId: string, targetUserId: string): void {
  const i = blocks.findIndex((b) => b.blockerId === viewerId && b.blockedId === targetUserId);
  if (i >= 0) blocks.splice(i, 1);
  else blocks.push({ blockerId: viewerId, blockedId: targetUserId });
  persistAll();
}

export function isMuted(viewerId: string, targetUserId: string): boolean {
  return mutes.some((m) => m.muterId === viewerId && m.mutedId === targetUserId);
}

export function toggleMute(viewerId: string, targetUserId: string): void {
  const i = mutes.findIndex((m) => m.muterId === viewerId && m.mutedId === targetUserId);
  if (i >= 0) mutes.splice(i, 1);
  else mutes.push({ muterId: viewerId, mutedId: targetUserId });
  persistAll();
}

export async function getMinistries(): Promise<Ministry[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listMinistries();
  return ministries;
}

export async function getMinistryById(id: string): Promise<Ministry | null> {
  if (DATA_MODE === "supabase") return supabaseRepo.getMinistryById(id);
  return ministries.find((m) => m.id === id) ?? null;
}

export async function createSupportIntent(input: {
  ministryId: string;
  donorId: string | null;
  purpose: import("@/lib/domain/types").SupportPurpose;
  amountKrw: number;
  message?: string;
}): Promise<import("@/lib/domain/types").SupportIntent> {
  if (DATA_MODE === "supabase") return supabaseRepo.createSupportIntent(input);
  throw new Error("createSupportIntent not available in memory mode");
}

export async function getSupportIntent(id: string): Promise<import("@/lib/domain/types").SupportIntent | null> {
  if (DATA_MODE === "supabase") return supabaseRepo.getSupportIntent(id);
  return null;
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
  if (DATA_MODE === "supabase") return supabaseRepo.completeSupportIntent(intentId, tx);
}

export async function failSupportIntent(intentId: string): Promise<void> {
  if (DATA_MODE === "supabase") return supabaseRepo.failSupportIntent(intentId);
}

// ----- Bookmarks -----

type BookmarkEntry = { userId: string; postId: string; createdAt: string };
let bookmarks: BookmarkEntry[] = [];
const bookmarksAdapter = createLocalAdapter<BookmarkEntry[]>("bookmarks");

function loadBookmarks() {
  if (typeof window === "undefined") return;
  const loaded = bookmarksAdapter.load();
  if (loaded != null && Array.isArray(loaded)) bookmarks = loaded;
}
loadBookmarks();

export async function toggleBookmark(userId: string, postId: string): Promise<{ bookmarked: boolean }> {
  if (DATA_MODE === "supabase") return supabaseRepo.toggleBookmark(userId, postId);
  const i = bookmarks.findIndex((b) => b.userId === userId && b.postId === postId);
  if (i >= 0) {
    bookmarks.splice(i, 1);
    bookmarksAdapter.save(bookmarks);
    return { bookmarked: false };
  }
  bookmarks.push({ userId, postId, createdAt: new Date().toISOString() });
  bookmarksAdapter.save(bookmarks);
  return { bookmarked: true };
}

export async function listBookmarks(userId: string, limit = 50): Promise<PostWithAuthor[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listBookmarks(userId, limit);
  const userBookmarks = bookmarks
    .filter((b) => b.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
  const postIds = new Set(userBookmarks.map((b) => b.postId));
  const bookmarkedPosts = posts.filter((p) => postIds.has(p.id));
  return bookmarkedPosts.map((p) => {
    const author = users.find((u) => u.id === p.authorId) ?? {
      id: p.authorId, name: "Unknown", role: "LAY" as const, createdAt: p.createdAt,
    };
    const postReactions = reactions.filter((r) => r.postId === p.id);
    return {
      ...p,
      author,
      reactionsByCurrentUser: {
        prayed: postReactions.some((r) => r.userId === userId && r.type === "PRAYED"),
        withYou: postReactions.some((r) => r.userId === userId && r.type === "WITH_YOU"),
      },
      reactionCounts: {
        prayed: postReactions.filter((r) => r.type === "PRAYED").length,
        withYou: postReactions.filter((r) => r.type === "WITH_YOU").length,
      },
    } as PostWithAuthor;
  });
}

export async function getBookmarkedPostIds(userId: string, postIds: string[]): Promise<string[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.getBookmarkedPostIds(userId, postIds);
  const set = new Set(postIds);
  return bookmarks.filter((b) => b.userId === userId && set.has(b.postId)).map((b) => b.postId);
}

export async function getCommentById(commentId: string): Promise<(import("@/lib/domain/types").Comment & { author: import("@/lib/domain/types").User }) | null> {
  if (DATA_MODE === "supabase") return supabaseRepo.getCommentById(commentId);
  return null;
}

// ─── Comment Reactions ───────────────────────────────────────────────────────

export async function toggleCommentLike(commentId: string, userId: string): Promise<{ liked: boolean; count: number }> {
  if (DATA_MODE === "supabase") return supabaseRepo.toggleCommentLike(commentId, userId);
  return { liked: false, count: 0 };
}

export async function getCommentLikeCounts(commentIds: string[], viewerId: string | null): Promise<Record<string, { count: number; likedByMe: boolean }>> {
  if (DATA_MODE === "supabase") return supabaseRepo.getCommentLikeCounts(commentIds, viewerId);
  const result: Record<string, { count: number; likedByMe: boolean }> = {};
  for (const id of commentIds) result[id] = { count: 0, likedByMe: false };
  return result;
}

// ─── Direct Messages ─────────────────────────────────────────────────────────

export async function sendDirectMessage(senderId: string, recipientId: string, content: string): Promise<import("@/lib/domain/types").DirectMessage> {
  if (DATA_MODE === "supabase") return supabaseRepo.sendDirectMessage(senderId, recipientId, content);
  throw new Error("DM not supported in memory mode");
}

export async function listConversations(userId: string): Promise<import("@/lib/domain/types").ConversationPreview[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listConversations(userId);
  return [];
}

export async function listMessages(userId: string, partnerId: string, limit?: number): Promise<(import("@/lib/domain/types").DirectMessage & { sender: import("@/lib/domain/types").User })[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listMessages(userId, partnerId, limit);
  return [];
}

export async function markConversationRead(userId: string, partnerId: string): Promise<void> {
  if (DATA_MODE === "supabase") return supabaseRepo.markConversationRead(userId, partnerId);
}

export async function countUnreadDMs(userId: string): Promise<number> {
  if (DATA_MODE === "supabase") return supabaseRepo.countUnreadDMs(userId);
  return 0;
}

export async function uploadAvatar(
  userId: string,
  fileBuffer: ArrayBuffer,
  mimeType: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (DATA_MODE === "supabase") return supabaseRepo.uploadAvatar(userId, fileBuffer, mimeType);
  return { ok: false, error: "Not supported" };
}

export async function getTodaysDailyPrayer(): Promise<import("@/lib/domain/types").PostWithAuthor | null> {
  if (DATA_MODE === "supabase") return supabaseRepo.getTodaysDailyPrayer();
  return null;
}

export async function listPostsByCategory(category: string, limit?: number): Promise<import("@/lib/domain/types").PostWithAuthor[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listPostsByCategory(category, limit);
  return [];
}

// =============================================================
// Notification preferences
// =============================================================

export async function getNotificationPrefs(userId: string): Promise<import("@/lib/domain/types").NotificationPrefs> {
  if (DATA_MODE === "supabase") return supabaseRepo.getNotificationPrefs(userId);
  const { DEFAULT_NOTIFICATION_PREFS } = await import("@/lib/domain/types");
  return { ...DEFAULT_NOTIFICATION_PREFS };
}

export async function updateNotificationPrefs(userId: string, prefs: Partial<import("@/lib/domain/types").NotificationPrefs>): Promise<{ ok: boolean; error?: string }> {
  if (DATA_MODE === "supabase") return supabaseRepo.updateNotificationPrefs(userId, prefs);
  return { ok: true };
}

// =============================================================
// Missionary projects
// =============================================================

export async function listMissionaryProjects(opts?: Parameters<typeof supabaseRepo.listMissionaryProjects>[0]): Promise<import("@/lib/domain/types").MissionaryProject[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listMissionaryProjects(opts);
  return [];
}

export async function getMissionaryProjectById(id: string, viewerId?: string | null): Promise<import("@/lib/domain/types").MissionaryProject | null> {
  if (DATA_MODE === "supabase") return supabaseRepo.getMissionaryProjectById(id, viewerId);
  return null;
}

export async function createMissionaryProject(input: Parameters<typeof supabaseRepo.createMissionaryProject>[0]): Promise<import("@/lib/domain/types").MissionaryProject> {
  if (DATA_MODE === "supabase") return supabaseRepo.createMissionaryProject(input);
  throw new Error("Not supported");
}

export async function listMissionaryReports(projectId: string): Promise<import("@/lib/domain/types").MissionaryReport[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listMissionaryReports(projectId);
  return [];
}

export async function createMissionaryReport(projectId: string, content: string): Promise<import("@/lib/domain/types").MissionaryReport> {
  if (DATA_MODE === "supabase") return supabaseRepo.createMissionaryReport(projectId, content);
  throw new Error("Not supported");
}

export async function listMissionarySupporters(projectId: string): Promise<import("@/lib/domain/types").MissionarySupporter[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listMissionarySupporters(projectId);
  return [];
}

export async function toggleMissionarySupport(projectId: string, userId: string): Promise<"added" | "removed"> {
  if (DATA_MODE === "supabase") return supabaseRepo.toggleMissionarySupport(projectId, userId);
  return "added";
}

// =============================================================
// Cells / Network / Creator
// =============================================================

export async function listCellsByUserId(userId: string): Promise<import("@/lib/domain/types").Cell[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listCellsByUserId(userId);
  return [];
}

export async function listSuggestedUsers(currentUserId: string, limit?: number): Promise<import("@/lib/domain/types").User[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listSuggestedUsers(currentUserId, limit);
  return [];
}

export async function getCreatorStats(authorId: string): Promise<{ postCount: number; totalPrayed: number; totalWithYou: number; totalComments: number }> {
  if (DATA_MODE === "supabase") return supabaseRepo.getCreatorStats(authorId);
  return { postCount: 0, totalPrayed: 0, totalWithYou: 0, totalComments: 0 };
}

// =============================================================
// Theology Q&A
// =============================================================

export async function listTheologyQuestions(opts?: Parameters<typeof supabaseRepo.listTheologyQuestions>[0]): Promise<import("@/lib/domain/types").TheologyQuestion[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listTheologyQuestions(opts);
  return [];
}

export async function getTheologyQuestionById(id: string, viewerId?: string | null): Promise<import("@/lib/domain/types").TheologyQuestion | null> {
  if (DATA_MODE === "supabase") return supabaseRepo.getTheologyQuestionById(id, viewerId);
  return null;
}

export async function createTheologyQuestion(input: Parameters<typeof supabaseRepo.createTheologyQuestion>[0]): Promise<import("@/lib/domain/types").TheologyQuestion> {
  if (DATA_MODE === "supabase") return supabaseRepo.createTheologyQuestion(input);
  throw new Error("Not supported");
}

export async function deleteTheologyQuestion(id: string, userId: string): Promise<void> {
  if (DATA_MODE === "supabase") return supabaseRepo.deleteTheologyQuestion(id, userId);
}

export async function listTheologyAnswers(questionId: string, viewerId?: string | null): Promise<import("@/lib/domain/types").TheologyAnswer[]> {
  if (DATA_MODE === "supabase") return supabaseRepo.listTheologyAnswers(questionId, viewerId);
  return [];
}

export async function createTheologyAnswer(questionId: string, userId: string, content: string): Promise<void> {
  if (DATA_MODE === "supabase") return supabaseRepo.createTheologyAnswer(questionId, userId, content);
}

export async function toggleTheologyAnswerVote(answerId: string, userId: string): Promise<"added" | "removed"> {
  if (DATA_MODE === "supabase") return supabaseRepo.toggleTheologyAnswerVote(answerId, userId);
  return "added";
}

export async function acceptTheologyAnswer(answerId: string, questionId: string): Promise<void> {
  if (DATA_MODE === "supabase") return supabaseRepo.acceptTheologyAnswer(answerId, questionId);
}
