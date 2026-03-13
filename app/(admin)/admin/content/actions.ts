"use server";

import { revalidatePath } from "next/cache";
import { getAdminOrNull } from "@/lib/admin/guard";
import { hidePost, unhidePost } from "@/lib/data/adminRepository";

export async function hidePostAction(postId: string): Promise<{ ok: true } | { error: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { error: "Unauthorized" };
  await hidePost(admin.userId, postId);
  revalidatePath("/admin/content");
  return { ok: true };
}

export async function unhidePostAction(postId: string): Promise<{ ok: true } | { error: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { error: "Unauthorized" };
  await unhidePost(admin.userId, postId);
  revalidatePath("/admin/content");
  return { ok: true };
}
