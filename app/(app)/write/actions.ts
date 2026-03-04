"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { createPost } from "@/lib/data/repository";
import type { PostCategory, Visibility } from "@/lib/domain/types";

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
  const tags = tagsInput
    ? tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 5)
    : [];
  await createPost({
    authorId: session.userId,
    category,
    content: trimmed,
    visibility: "MEMBERS",
    tags,
  });
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
  console.log("[composePostAction /write] hit");
  const session = await getSession();
  if (!session) {
    console.warn("[composePostAction /write] session null");
    return { ok: false, error: "Not logged in. Please refresh and try again." };
  }
  const trimmed = params.content.trim();
  if (!trimmed) return { ok: false, error: "Content is required" };
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
    revalidatePath("/feed");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create post";
    console.error("[composePostAction /write] createPost error", msg);
    return { ok: false, error: msg };
  }
}
