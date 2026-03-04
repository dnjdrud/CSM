"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { addComment, deleteComment, updateComment, deletePost, updatePost } from "@/lib/data/repository";
import { assertRateLimit, RATE_LIMIT_EXCEEDED, RATE_LIMIT_MESSAGE } from "@/lib/security/rateLimit";

export async function addCommentAction(
  postId: string,
  content: string,
  parentId?: string
): Promise<{ ok: boolean; error?: string }> {
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
    await addComment({
      postId,
      authorId: session.userId,
      content: trimmed,
      parentId: parentId || undefined,
    });
    revalidatePath(`/post/${postId}`);
    revalidatePath("/feed");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to add comment" };
  }
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
