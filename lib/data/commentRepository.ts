import type { User, Comment } from "@/lib/domain/types";
import { supabaseServer } from "@/lib/supabase/server";
import { getAuthorMap } from "./_internal/postHelpers";

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
  const { data: row, error } = await supabase
    .from("comments")
    .update({ content: trimmed })
    .eq("id", commentId)
    .eq("author_id", actorId)
    .select("id, post_id, author_id, content, parent_id, created_at")
    .single();
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

export async function getCommentAuthorId(commentId: string): Promise<string | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("comments").select("author_id").eq("id", commentId).single();
  return data?.author_id ?? null;
}

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
    await supabase
      .from("comment_reactions")
      .insert({ comment_id: commentId, user_id: userId, type: "LIKE" });
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
