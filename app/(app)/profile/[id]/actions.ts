"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { toggleMute, toggleBlock, deactivateUser, restoreUser, updateUserProfile, getCurrentUser, listPostsByAuthorIdPaged, listFollowingIds, isBlocked, isMuted, listSharedNotesByUserIdPaged, uploadAvatar } from "@/lib/data/repository";
import { supabaseServer } from "@/lib/supabase/server";
import { canViewPost } from "@/lib/domain/guards";
import type { UserRole, PostWithAuthor, Note } from "@/lib/domain/types";

const POSTS_PAGE_SIZE = 20;
const NOTES_PAGE_SIZE = 20;

/** 프로필 포스트 탭: 다음 페이지 로드. 가시성/차단 필터 적용. */
export async function loadMoreProfilePostsAction(
  profileId: string,
  offset: number
): Promise<{ items: PostWithAuthor[]; hasMore: boolean }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { items: [], hasMore: false };
  const blocked = isBlocked(currentUser.id, profileId);
  const muted = isMuted(currentUser.id, profileId);
  if (blocked || muted) return { items: [], hasMore: false };
  const followingIds = await listFollowingIds(currentUser.id);
  const isFollowing = (followerId: string, followingId: string) =>
    followerId === currentUser.id && followingIds.includes(followingId);
  // 필터가 있어서 요청보다 적게 나올 수 있으므로 두 배로 요청
  const { items, hasMore } = await listPostsByAuthorIdPaged({
    authorId: profileId,
    limit: POSTS_PAGE_SIZE * 2,
    offset,
  });
  const filtered = items
    .filter((p) => canViewPost(p, currentUser, isFollowing));
  return { items: filtered.slice(0, POSTS_PAGE_SIZE), hasMore: hasMore || filtered.length > POSTS_PAGE_SIZE };
}

/** 프로필 노트 탭: 다음 페이지 로드. */
export async function loadMoreProfileNotesAction(
  profileId: string,
  offset: number
): Promise<{ items: Note[]; hasMore: boolean }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { items: [], hasMore: false };
  const blocked = isBlocked(currentUser.id, profileId);
  if (blocked) return { items: [], hasMore: false };
  return listSharedNotesByUserIdPaged({ userId: profileId, limit: NOTES_PAGE_SIZE, offset });
}

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
  supportUrl?: string | null;
}): Promise<UpdateProfileResult> {
  const session = await getSession();
  if (!session) return { error: "로그인이 필요합니다." };

  // 서버 필수 검증
  const name = data.name?.trim();
  if (name !== undefined && !name) return { error: "이름은 비워둘 수 없습니다." };

  // username이 payload에 포함된 경우 필수 · 형식 검증
  if ("username" in data) {
    const u = (data.username ?? "").trim();
    if (!u) return { error: "사용자 이름은 필수 입력사항입니다." };
    if (u.length < 2) return { error: "사용자 이름은 2자 이상이어야 합니다." };
    if (!/^[a-zA-Z0-9_]+$/.test(u)) return { error: "사용자 이름은 영문, 숫자, 밑줄(_)만 사용 가능합니다." };
  }

  // denomination이 payload에 포함된 경우 필수 검증
  if ("denomination" in data) {
    if (!data.denomination?.trim()) return { error: "교단을 선택해주세요." };
  }

  // church가 payload에 포함된 경우 필수 검증
  if ("church" in data) {
    if (!data.church?.trim()) return { error: "교회명은 필수 입력사항입니다." };
  }

  const role = data.role && ALLOWED_ROLES.includes(data.role) ? data.role : undefined;
  const result = await updateUserProfile(session.userId, { ...data, name: name || undefined, role });
  if ("ok" in result && result.ok) {
    revalidatePath(`/profile/${session.userId}`);
    revalidatePath("/settings/profile");
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

export async function uploadAvatarAction(formData: FormData): Promise<{ ok: boolean; url?: string; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "로그인이 필요합니다." };
  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "파일을 선택해주세요." };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "파일 크기는 5MB 이하여야 합니다." };
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) return { ok: false, error: "JPG, PNG, WEBP 형식만 지원합니다." };
  const buffer = await file.arrayBuffer();
  const result = await uploadAvatar(session.userId, buffer, file.type);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath(`/profile/${session.userId}`);
  revalidatePath("/settings/profile");
  revalidatePath("/feed");
  revalidatePath("/home");
  return { ok: true, url: result.url };
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
