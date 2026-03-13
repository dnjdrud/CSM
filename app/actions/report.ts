"use server";

import { getSession } from "@/lib/auth/session";
import { createReport, getPostById, getCommentAuthorId } from "@/lib/data/repository";
import { assertRateLimit, RATE_LIMIT_EXCEEDED, RATE_LIMIT_MESSAGE } from "@/lib/security/rateLimit";

export type ReportResult = { ok: true } | { ok: false; error: string };

export async function reportPostAction(
  postId: string,
  reason: string
): Promise<ReportResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  try {
    await assertRateLimit({ userId: session.userId, action: "REPORT" });
  } catch (e) {
    return { ok: false, error: e instanceof Error && e.message === RATE_LIMIT_EXCEEDED ? RATE_LIMIT_MESSAGE : "Failed to submit report" };
  }
  const post = await getPostById(postId);
  const targetUserId = post?.authorId;
  await createReport({
    type: "REPORT_POST",
    reporterId: session.userId,
    postId,
    reason: reason.trim() || undefined,
    targetUserId,
  });
  return { ok: true };
}

export async function reportCommentAction(
  commentId: string,
  postId: string,
  reason: string
): Promise<ReportResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  try {
    await assertRateLimit({ userId: session.userId, action: "REPORT" });
  } catch (e) {
    return { ok: false, error: e instanceof Error && e.message === RATE_LIMIT_EXCEEDED ? RATE_LIMIT_MESSAGE : "Failed to submit report" };
  }
  const targetUserId = await getCommentAuthorId(commentId);
  await createReport({
    type: "REPORT_COMMENT",
    reporterId: session.userId,
    postId,
    commentId,
    reason: reason.trim() || undefined,
    targetUserId: targetUserId ?? undefined,
  });
  return { ok: true };
}

export async function reportUserAction(
  targetUserId: string,
  reason: string
): Promise<ReportResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  if (session.userId === targetUserId) return { ok: false, error: "Cannot report yourself" };
  try {
    await assertRateLimit({ userId: session.userId, action: "REPORT" });
  } catch (e) {
    return { ok: false, error: e instanceof Error && e.message === RATE_LIMIT_EXCEEDED ? RATE_LIMIT_MESSAGE : "Failed to submit report" };
  }
  await createReport({
    type: "REPORT_USER",
    reporterId: session.userId,
    reason: reason.trim() || undefined,
    targetUserId,
  });
  return { ok: true };
}
