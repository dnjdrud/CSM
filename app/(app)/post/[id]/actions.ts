"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { addComment, deleteComment, updateComment, deletePost, updatePost, toggleCommentLike, getCommentById, searchPeople } from "@/lib/data/repository";
import { assertRateLimit, RATE_LIMIT_EXCEEDED, RATE_LIMIT_MESSAGE } from "@/lib/security/rateLimit";
import type { User } from "@/lib/domain/types";

export async function searchMentionUsersAction(q: string): Promise<Pick<User, "id" | "name" | "username">[]> {
  const session = await getSession();
  if (!session || !q.trim()) return [];
  const results = await searchPeople({ q: q.trim(), viewerId: session.userId });
  return results.slice(0, 8).map((u) => ({ id: u.id, name: u.name, username: u.username ?? null }));
}

export async function addCommentAction(
  postId: string,
  content: string,
  parentId?: string
): Promise<{ ok: boolean; error?: string }> {
  console.log("[addCommentAction] hit");
  const session = await getSession();
  console.log("[addCommentAction] session", session);
  if (!session) {
    const { getAuthUserId } = await import("@/lib/auth/session");
    const authUserId = await getAuthUserId();
    console.warn("[addCommentAction] session null. getAuthUserId:", authUserId ?? "null", "(if auth exists but session null, check users row / RLS)");
    return { ok: false, error: "Not logged in" };
  }
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Comment is required" };
  try {
    await assertRateLimit({ userId: session.userId, action: "CREATE_COMMENT" });
  } catch (e) {
    return { ok: false, error: e instanceof Error && e.message === RATE_LIMIT_EXCEEDED ? RATE_LIMIT_MESSAGE : "Failed to add comment" };
  }
  try {
    const payload = {
      postId,
      authorId: session.userId,
      content: trimmed,
      parentId: parentId || undefined,
    };
    console.log("[addCommentAction] insert payload", payload);
    await addComment(payload);
    revalidatePath(`/post/${postId}`);
    revalidatePath("/feed");

    // Fire mention notifications for @name / @username patterns
    const mentionMatches = [...new Set(trimmed.match(/@([^\s@,!?.]+)/g) ?? [])];
    if (mentionMatches.length > 0) {
      try {
        const { notifyMentioned } = await import("@/lib/notifications/events");
        const { supabaseServer } = await import("@/lib/supabase/server");
        const supabase = await supabaseServer();
        for (const mention of mentionMatches.slice(0, 5)) {
          const q = mention.slice(1); // strip @
          const { data: matched } = await supabase
            .from("users")
            .select("id")
            .or(`username.ilike.${q},name.ilike.${q}`)
            .limit(3);
          for (const u of matched ?? []) {
            await notifyMentioned({ recipientId: u.id, actorId: session.userId, postId });
          }
        }
      } catch {
        // mention notifications are best-effort
      }
    }

    return { ok: true };
  } catch (e) {
    console.error(
      "[addCommentAction] supabase error",
      e instanceof Error ? e.message : e
    );
    return {
      ok: false,
      error: e instanceof Error && e.message ? e.message : "Failed to add comment",
    };
  }
}

/** Server Action used by form action=... on post detail page. Must return void for form action type. */
export async function addCommentFormAction(formData: FormData): Promise<void> {
  const postId = formData.get("postId");
  const content = formData.get("content");
  const parentId = formData.get("parentId");
  await addCommentAction(
    typeof postId === "string" ? postId : "",
    typeof content === "string" ? content : "",
    typeof parentId === "string" && parentId.length > 0 ? parentId : undefined
  );
}

export async function deleteCommentAction(commentId: string, postId?: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  const ok = await deleteComment(commentId, session.userId);
  if (!ok) return { ok: false, error: "Not allowed or not found" };
  revalidatePath("/feed");
  if (postId) revalidatePath(`/post/${postId}`);
  return { ok: true };
}

export async function updateCommentAction(commentId: string, content: string, postId?: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Content is required" };
  const updated = await updateComment(commentId, session.userId, trimmed);
  if (!updated) return { ok: false, error: "Not allowed or not found" };
  revalidatePath("/feed");
  if (postId) revalidatePath(`/post/${postId}`);
  return { ok: true };
}

export async function deletePostAction(postId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  const ok = await deletePost(postId, session.userId);
  if (!ok) return { ok: false, error: "Not allowed or not found" };
  revalidatePath("/feed");
  revalidatePath(`/post/${postId}`);
  redirect("/feed");
}

export async function toggleCommentLikeAction(
  commentId: string,
  postId: string
): Promise<{ ok: boolean; liked?: boolean; count?: number; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  try {
    const result = await toggleCommentLike(commentId, session.userId);
    // Fire notification if liked (not on unlike)
    if (result.liked) {
      const { supabaseServer } = await import("@/lib/supabase/server");
      const supabase = await supabaseServer();
      const { data: comment } = await supabase.from("comments").select("author_id").eq("id", commentId).single();
      if (comment && comment.author_id !== session.userId) {
        const { notifyCommentReacted } = await import("@/lib/notifications/events");
        await notifyCommentReacted({ recipientId: comment.author_id, actorId: session.userId, postId });
      }
    }
    return { ok: true, liked: result.liked, count: result.count };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function getCommentByIdAction(commentId: string) {
  return getCommentById(commentId);
}

export async function updatePostAction(
  postId: string,
  content: string,
  category?: string,
  visibility?: string,
  tags?: string[]
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Content is required" };
  const updated = await updatePost(postId, session.userId, {
    content: trimmed,
    category: category as "PRAYER" | "DEVOTIONAL" | "MINISTRY" | undefined,
    visibility: visibility as "PUBLIC" | "MEMBERS" | "FOLLOWERS" | "PRIVATE" | undefined,
    tags,
  });
  if (!updated) return { ok: false, error: "Not allowed or not found" };
  revalidatePath("/feed");
  revalidatePath(`/post/${postId}`);
  return { ok: true };
}
