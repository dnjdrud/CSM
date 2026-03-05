"use server";

import { getSession } from "@/lib/auth/session";
import { addComment as addCommentRepo, listCommentsByPostId } from "@/lib/data/repository";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Comment } from "@/lib/domain/types";

const CONTENT_MAX_LENGTH = 500;

export type CommunityComment = Comment & { author: { id: string; name: string } };

/** List comments for a post (created_at asc). For community ContentPanel. */
export async function listCommunityCommentsAction(
  postId: string
): Promise<{ comments: CommunityComment[]; error: string | null }> {
  if (!postId?.trim()) return { comments: [], error: null };
  try {
    const list = await listCommentsByPostId(postId);
    const comments: CommunityComment[] = list.map((c) => ({
      id: c.id,
      postId: c.postId,
      authorId: c.authorId,
      content: c.content,
      createdAt: c.createdAt,
      parentId: c.parentId,
      author: { id: c.author.id, name: c.author.name },
    }));
    return { comments, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { comments: [], error: msg };
  }
}

/** Add comment. Uses getSession().userId for author_id. Falls back to service role if RLS blocks. */
export async function addCommentAction(
  postId: string,
  content: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session?.userId) {
    return { ok: false, error: "로그인 후 댓글을 달 수 있습니다." };
  }

  const trimmed = content?.trim() ?? "";
  if (!trimmed) return { ok: false, error: "댓글 내용을 입력해 주세요." };
  if (trimmed.length > CONTENT_MAX_LENGTH) {
    return { ok: false, error: `댓글은 ${CONTENT_MAX_LENGTH}자 이내로 입력해 주세요.` };
  }

  try {
    await addCommentRepo({
      postId,
      authorId: session.userId,
      content: trimmed,
    });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        const { error } = await admin
          .from("comments")
          .insert({
            post_id: postId,
            author_id: session.userId,
            content: trimmed,
          })
          .select("id")
          .single();
        if (error) return { ok: false, error: error.message };
        return { ok: true };
      } catch {
        return { ok: false, error: msg };
      }
    }
    return { ok: false, error: msg };
  }
}
