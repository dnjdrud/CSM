"use server";

import { revalidatePath } from "next/cache";
import { getAdminOrNull } from "@/lib/admin/guard";
import {
  hidePost,
  deleteComment,
  resolveModerationReport,
  pinPost,
  unpinPost,
} from "@/lib/data/adminRepository";

export async function hidePostAction(postId: string, reportId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Forbidden" };
  try {
    await hidePost(admin.userId, postId);
    await resolveModerationReport(admin.userId, reportId);
    revalidatePath("/admin/moderation");
    revalidatePath("/feed");
    revalidatePath(`/post/${postId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function pinPostAction(postId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Forbidden" };
  try {
    await pinPost(admin.userId, postId);
    revalidatePath("/admin/moderation");
    revalidatePath("/feed");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function unpinPostAction(): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Forbidden" };
  try {
    await unpinPost(admin.userId);
    revalidatePath("/admin/moderation");
    revalidatePath("/feed");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteCommentAction(commentId: string, reportId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Forbidden" };
  try {
    await deleteComment(admin.userId, commentId);
    await resolveModerationReport(admin.userId, reportId);
    revalidatePath("/admin/moderation");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function resolveReportAction(reportId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Forbidden" };
  try {
    await resolveModerationReport(admin.userId, reportId);
    revalidatePath("/admin/moderation");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
