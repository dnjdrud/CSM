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

/** Current user: Supabase auth + public.users only. Returns null when not logged in or no profile. */
export async function getCurrentUser(): Promise<User | null> {
  if (!useSupabaseAuth()) return null;
  try {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const supabase = await supabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    if (!user?.id) return null;
    const { data: row } = await supabase
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
export async function searchPeople(params: { q: string; viewerId: string }): Promise<User[]> {
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
  return {
    ...post,
    tags: post.tags ?? [],
    author,
    reactionsByCurrentUser: { prayed, withYou },
    reactionCounts,
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
  type: "REPORT_POST" | "REPORT_COMMENT";
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
    category: "PRAYER",
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

export function getMinistries(): Ministry[] {
  return ministries;
}

export function getMinistryById(id: string): Ministry | null {
  return ministries.find((m) => m.id === id) ?? null;
}
