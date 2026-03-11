"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { toggleMute, toggleBlock, deactivateUser, restoreUser, updateUserProfile } from "@/lib/data/repository";
import { supabaseServer } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/domain/types";

const ALLOWED_ROLES: UserRole[] = ["LAY", "MINISTRY_WORKER", "PASTOR", "MISSIONARY", "SEMINARIAN"];

export type UpdateProfileResult = { ok: true } | { error: string };

export async function updateProfileAction(data: {
  name?: string;
  username?: string | null;
  bio?: string | null;
  affiliation?: string | null;
  church?: string | null;
  denomination?: string | null;
  faithYears?: number | null;
  role?: UserRole;
}): Promise<UpdateProfileResult> {
  const session = await getSession();
  if (!session) return { error: "로그인이 필요합니다." };
  const name = data.name?.trim();
  if (name !== undefined && !name) return { error: "이름은 비워둘 수 없습니다." };
  const role = data.role && ALLOWED_ROLES.includes(data.role) ? data.role : undefined;
  const result = await updateUserProfile(session.userId, { ...data, name: name || undefined, role });
  if ("ok" in result && result.ok) {
    revalidatePath(`/profile/${session.userId}`);
    revalidatePath(`/profile/${session.userId}/edit`);
  }
  return result;
}

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
