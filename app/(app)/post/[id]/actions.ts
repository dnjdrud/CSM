"use server";

import { getSession } from "@/backend/connection";
import { addComment, toggleCommentLike, getCommentById, searchPeople } from "@/lib/data/repository";
import { assertRateLimit, RATE_LIMIT_EXCEEDED, RATE_LIMIT_MESSAGE } from "@/backend/permissions";
import { revalidatePostPaths } from "@/lib/utils/revalidation";
import type { User } from "@/lib/domain/types";

export {
  deleteCommentAction,
  updateCommentAction,
  updatePostAction,
  deletePostAction,
} from "@/app/(app)/_actions/postMutations";

export async function searchMentionUsersAction(q: string): Promise<Pick<User, "id" | "name" | "username">[]> {
  const session = await getSession();
  if (!session || !q.trim()) return [];
  const results = await searchPeople({ q: q.trim(), viewerId: session.userId });
  return results.slice(0, 8).map((u) => ({ id: u.id, name: u.name, username: u.username ?? null }));
}

/**
 * Post-detail addCommentAction: includes mention notification firing.
 * Shadows the shared version intentionally.
 */
export async function addCommentAction(
  postId: string,
  content: string,
  parentId?: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Comment is required" };
  try {
    await assertRateLimit({ userId: session.userId, action: "CREATE_COMMENT" });
  } catch (e) {
    return { ok: false, error: e instanceof Error && e.message === RATE_LIMIT_EXCEEDED ? RATE_LIMIT_MESSAGE : "Failed to add comment" };
  }
  try {
    await addComment({
      postId,
      authorId: session.userId,
      content: trimmed,
      parentId: parentId || undefined,
    });
    revalidatePostPaths(postId);

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
    console.error("[addCommentAction] supabase error", e instanceof Error ? e.message : e);
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

export async function toggleCommentLikeAction(
  commentId: string,
  postId: string
): Promise<{ ok: boolean; liked?: boolean; count?: number; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  try {
    const result = await toggleCommentLike(commentId, session.userId);
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
