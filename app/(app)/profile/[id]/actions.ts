"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { toggleMute, toggleBlock, deactivateUser, restoreUser } from "@/lib/data/repository";
import { supabaseServer } from "@/lib/supabase/server";

export async function toggleFollowAction(profileId: string): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  const { toggleFollow } = await import("@/lib/data/repository");
  await toggleFollow(session.userId, profileId);
  revalidatePath(`/profile/${profileId}`);
  revalidatePath("/feed");
  return true;
}

export async function toggleMuteAction(targetUserId: string): Promise<void> {
  const session = await getSession();
  if (!session) return;
  toggleMute(session.userId, targetUserId);
  revalidatePath(`/profile/${targetUserId}`);
  revalidatePath("/feed");
}

export async function toggleBlockAction(targetUserId: string): Promise<void> {
  const session = await getSession();
  if (!session) return;
  toggleBlock(session.userId, targetUserId);
  revalidatePath(`/profile/${targetUserId}`);
  revalidatePath("/feed");
}

/** Soft-deactivate account, hide posts, then sign out and redirect. */
export async function deactivateAccountAction(): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  try {
    await deactivateUser(session.userId);
    const supabase = await supabaseServer();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/?message=account_deactivated");
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to deactivate" };
  }
  return { ok: true };
}

/** Restore account within 7 days. */
export async function restoreAccountAction(): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };
  const result = await restoreUser(session.userId);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath("/", "layout");
  revalidatePath(`/profile/${session.userId}`);
  return { ok: true };
}
