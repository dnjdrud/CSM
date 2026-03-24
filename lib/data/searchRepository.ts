import type { User, PostWithAuthor } from "@/lib/domain/types";
import { supabaseServer } from "@/lib/supabase/server";
import { tokenize, sortByScore } from "@/lib/search";
import {
  SEARCH_MAX,
  POSTS_FEED_SELECT,
  rowToUser,
  hydratePostRows,
} from "./_internal/postHelpers";
import type { FeedPostRow } from "./_internal/postHelpers";

export async function searchPosts(params: {
  q: string;
  currentUserId: string;
  scope?: "ALL" | "FOLLOWING";
}): Promise<PostWithAuthor[]> {
  const tokens = tokenize(params.q);
  if (tokens.length === 0) return [];
  const supabase = await supabaseServer();
  let query = supabase
    .from("posts")
    .select(POSTS_FEED_SELECT)
    .order("created_at", { ascending: false });
  if (params.scope === "FOLLOWING") {
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
  const hydrated = await hydratePostRows(supabase, rows as FeedPostRow[], params.currentUserId);
  const getSearchText = (p: PostWithAuthor) =>
    [p.content, (p.tags ?? []).join(" "), p.author.name].join(" ");
  return sortByScore(hydrated, getSearchText, tokens).slice(0, SEARCH_MAX);
}

export async function listAllTags(): Promise<string[]> {
  const supabase = await supabaseServer();
  const { data: rows } = await supabase.from("posts").select("tags");
  const set = new Set<string>();
  (rows ?? []).forEach((r) => (r.tags ?? []).forEach((t: string) => set.add(t)));
  return Array.from(set).sort();
}

export async function listPopularTags(
  limit = 20
): Promise<{ tag: string; sampleCount: number }[]> {
  const supabase = await supabaseServer();
  const { data: rows } = await supabase.from("posts").select("tags");
  const counts = new Map<string, number>();
  (rows ?? []).forEach((r) =>
    (r.tags ?? []).forEach((t: string) => counts.set(t, (counts.get(t) ?? 0) + 1))
  );
  return Array.from(counts.entries())
    .map(([tag, sampleCount]) => ({ tag, sampleCount }))
    .sort((a, b) => b.sampleCount - a.sampleCount)
    .slice(0, limit);
}

export async function searchTags(q: string): Promise<string[]> {
  const tokens = tokenize(q);
  if (tokens.length === 0) return [];
  const all = await listAllTags();
  return sortByScore(all, (tag) => tag, tokens).slice(0, SEARCH_MAX);
}

export async function searchPeople(params: {
  q: string;
  viewerId: string;
  role?: string;
  denomination?: string;
}): Promise<User[]> {
  const tokens = tokenize(params.q);
  if (tokens.length === 0 && !params.role && !params.denomination) return [];
  const supabase = await supabaseServer();
  let query = supabase
    .from("users")
    .select("id, name, role, bio, affiliation, created_at, deactivated_at, denomination, support_url");
  if (params.role) query = query.eq("role", params.role) as typeof query;
  if (params.denomination) query = query.eq("denomination", params.denomination) as typeof query;
  const { data: rows } = await query;
  if (!rows?.length) return [];
  const users = rows.map((r) => rowToUser(r));
  if (tokens.length === 0) return users.slice(0, SEARCH_MAX);
  const getSearchText = (u: User) => [u.name, u.affiliation ?? "", u.bio ?? ""].join(" ");
  return sortByScore(users, getSearchText, tokens).slice(0, SEARCH_MAX);
}
