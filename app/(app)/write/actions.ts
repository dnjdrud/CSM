"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { createPost } from "@/lib/data/repository";
import { assertRateLimit, RATE_LIMIT_EXCEEDED, RATE_LIMIT_MESSAGE } from "@/lib/security/rateLimit";
import type { PostCategory, Visibility } from "@/lib/domain/types";
import { logInfo, logWarn, logError } from "@/lib/logging/systemLogger";

/** Publish post and redirect to feed (e.g. from /write page). */
export async function publishPostAction(
  category: PostCategory,
  content: string,
  tagsInput?: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Content is required" };
  try {
    await assertRateLimit({
      userId: session.userId,
      action: "CREATE_POST",
      maxPerMinute: 15,
      maxPer10Min: 50,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg === RATE_LIMIT_EXCEEDED ? RATE_LIMIT_MESSAGE : msg || "Rate limit or server error" };
  }
  const tags = tagsInput
    ? tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 5)
    : [];
  try {
    await createPost({
      authorId: session.userId,
      category,
      content: trimmed,
      visibility: "MEMBERS",
      tags,
    });
    logInfo("SERVER_ACTION", "publishPostAction success", {
      userId: session.userId,
      contentLength: trimmed.length,
      tagsCount: tags.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const display = (msg && msg.trim() !== "") ? msg : "Failed to create post (publish)";
    logError("SERVER_ACTION", "publishPostAction createPost error", {
      userId: session.userId,
      error: display,
    });
    return { ok: false, error: display };
  }
  revalidatePath("/feed");
  redirect("/feed");
}

/** Compose post (no redirect). Revalidates feed. Used by ComposeBox on /write. */
export async function composePostAction(params: {
  content: string;
  category?: PostCategory;
  visibility?: Visibility;
  tags?: string[];
}): Promise<{ ok: boolean; error?: string }> {
  logInfo("SERVER_ACTION", "composePostAction(write) start", {
    hasContent: params.content.trim().length > 0,
    category: params.category ?? "PRAYER",
    visibility: params.visibility ?? "MEMBERS",
    hasTags: !!params.tags && params.tags.length > 0,
  });
  const session = await getSession();
  if (!session) {
    logWarn("SERVER_ACTION", "composePostAction(write) session null");
    return { ok: false, error: "Not logged in. Please refresh and try again." };
  }
  const trimmed = params.content.trim();
  if (!trimmed) return { ok: false, error: "Content is required" };
  try {
    await assertRateLimit({
      userId: session.userId,
      action: "CREATE_POST",
      maxPerMinute: 15,
      maxPer10Min: 50,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logWarn("SERVER_ACTION", "composePostAction(write) rate limit or error", { userId: session.userId, rawMessage: msg });
    return { ok: false, error: msg === RATE_LIMIT_EXCEEDED ? RATE_LIMIT_MESSAGE : msg || "Rate limit or server error" };
  }
  const tags = params.tags
    ? [...new Set(params.tags.map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 5)
    : [];
  try {
    await createPost({
      authorId: session.userId,
      category: params.category ?? "PRAYER",
      content: trimmed,
      visibility: params.visibility ?? "MEMBERS",
      tags,
    });
    logInfo("SERVER_ACTION", "composePostAction(write) success", {
      userId: session.userId,
      contentLength: trimmed.length,
      tagsCount: tags.length,
    });
    revalidatePath("/feed");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const display = (msg && msg.trim() !== "") ? msg : "Failed to create post (check server logs)";
    logError("SERVER_ACTION", "composePostAction(write) createPost error", {
      userId: session.userId,
      error: display,
    });
    return { ok: false, error: display };
  }
}
