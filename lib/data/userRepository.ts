// Bookmark functions (toggleBookmark, listBookmarks, getBookmarkedPostIds) have been
// moved to bookmarkRepository.ts. Re-exported here for compatibility.
export * from "./bookmarkRepository";
// searchPeople has been moved to searchRepository.ts. Re-exported here for compatibility.
export * from "./searchRepository";

import type { User, UserRole } from "@/lib/domain/types";
import { supabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { rowToUser } from "./_internal/postHelpers";

const USERS_SELECT_FULL =
  "id, name, role, bio, affiliation, created_at, deactivated_at, denomination, faith_years, username, church, support_url, avatar_url";
const USERS_SELECT_NO_NEW_COLS =
  "id, name, role, bio, affiliation, created_at, deactivated_at, username, church, support_url, avatar_url";
const USERS_SELECT_MINIMAL = "id, name, role, bio, affiliation, created_at";

function isColumnError(msg: string): boolean {
  return /column.*does not exist|does not exist.*column|42703/i.test(String(msg));
}

export async function getUserById(id: string): Promise<User | null> {
  const r = await getUserByIdWithError(id);
  return r.user;
}

/** Returns user and optional error message for profile/error UI. Tries full select, then minimal if deactivated_at missing. */
export async function getUserByIdWithError(
  id: string
): Promise<{ user: User | null; errorMessage: string | null }> {
  const supabase = await supabaseServer();
  let data: {
    id: string;
    name: string | null;
    role: string | null;
    bio: string | null;
    affiliation: string | null;
    created_at: string | null;
    deactivated_at?: string | null;
  } | null;
  let error: Error | null = null;
  const full = await supabase.from("users").select(USERS_SELECT_FULL).eq("id", id).single();
  data = full.data as typeof data;
  error = full.error;
  if (error && isColumnError(error.message)) {
    const mid = await supabase.from("users").select(USERS_SELECT_NO_NEW_COLS).eq("id", id).single();
    data = mid.data as typeof data;
    error = mid.error;
  }
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
  const { error: userError } = await supabase
    .from("users")
    .update({ deactivated_at: null })
    .eq("id", userId);
  if (userError) return { ok: false, error: userError.message };
  await supabase.from("posts").update({ hidden_at: null, hidden_by: null }).eq("author_id", userId);
  return { ok: true };
}

/** Update own profile fields. Uses admin client to bypass RLS (caller must verify identity). */
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
  const admin = getSupabaseAdmin();
  const client = admin ?? (await supabaseServer());
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
  const { error } = await client.from("users").update(update).eq("id", userId);
  if (error) {
    console.error("[updateUserProfile] error", error.message, "update", JSON.stringify(update));
    if (/unique|duplicate/i.test(error.message) && /username/i.test(error.message)) {
      return { error: "이 사용자 이름은 이미 사용 중입니다." };
    }
    if (/unique|duplicate/i.test(error.message)) return { error: "이미 사용 중인 값이 있습니다." };
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

export async function listSuggestedUsers(currentUserId: string, limit = 20): Promise<User[]> {
  const supabase = await supabaseServer();
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

