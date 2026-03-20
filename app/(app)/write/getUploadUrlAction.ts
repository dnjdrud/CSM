"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type UploadUrlResult =
  | { signedUrl: string; publicUrl: string }
  | { error: string };

/**
 * Issues a signed upload URL for a post image.
 * The client PUTs the file directly to Supabase Storage — no file bytes
 * pass through this server.
 */
export async function getImageUploadUrlAction(
  filename: string,
  contentType: string,
  fileSize: number,
): Promise<UploadUrlResult> {
  const session = await getSession();
  if (!session) return { error: "로그인이 필요합니다." };
  if (!ALLOWED_IMAGE_TYPES.includes(contentType))
    return { error: "JPG, PNG, WEBP 파일만 업로드 가능합니다." };
  if (fileSize > MAX_IMAGE_BYTES)
    return { error: "파일 크기는 5MB 이하여야 합니다." };

  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${session.userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from("post-images")
    .createSignedUploadUrl(path);

  if (error || !data) return { error: `업로드 URL 생성 실패: ${error?.message}` };

  const { data: pub } = supabaseAdmin.storage.from("post-images").getPublicUrl(path);
  return { signedUrl: data.signedUrl, publicUrl: pub.publicUrl };
}

/**
 * Issues a signed upload URL for a shorts video.
 * The client PUTs the file directly to Supabase Storage — no file bytes
 * pass through this server.
 */
export async function getVideoUploadUrlAction(
  filename: string,
  contentType: string,
  fileSize: number,
): Promise<UploadUrlResult> {
  const session = await getSession();
  if (!session) return { error: "로그인이 필요합니다." };
  if (!ALLOWED_VIDEO_TYPES.includes(contentType))
    return { error: "MP4, MOV, WebM 파일만 업로드 가능합니다." };
  if (fileSize > MAX_VIDEO_BYTES)
    return { error: "파일 크기는 200MB 이하여야 합니다." };

  const ext = filename.split(".").pop()?.toLowerCase() ?? "mp4";
  const path = `${session.userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from("post-videos")
    .createSignedUploadUrl(path);

  if (error || !data) return { error: `업로드 URL 생성 실패: ${error?.message}` };

  const { data: pub } = supabaseAdmin.storage.from("post-videos").getPublicUrl(path);
  return { signedUrl: data.signedUrl, publicUrl: pub.publicUrl };
}

/**
 * Issues a signed upload URL for a profile avatar.
 * Uses upsert so the same path is overwritten on re-upload.
 */
export async function getAvatarUploadUrlAction(
  contentType: string,
  fileSize: number,
): Promise<UploadUrlResult> {
  const session = await getSession();
  if (!session) return { error: "로그인이 필요합니다." };
  if (!ALLOWED_IMAGE_TYPES.includes(contentType))
    return { error: "JPG, PNG, WEBP 파일만 업로드 가능합니다." };
  if (fileSize > MAX_IMAGE_BYTES)
    return { error: "파일 크기는 5MB 이하여야 합니다." };

  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const path = `${session.userId}/avatar.${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from("avatars")
    .createSignedUploadUrl(path, { upsert: true });

  if (error || !data) return { error: `업로드 URL 생성 실패: ${error?.message}` };

  const { data: pub } = supabaseAdmin.storage.from("avatars").getPublicUrl(path);
  // Append cache-buster so browsers don't show stale avatar
  return { signedUrl: data.signedUrl, publicUrl: `${pub.publicUrl}?t=${Date.now()}` };
}

/**
 * Saves the uploaded avatar URL to the users table and revalidates profile pages.
 * Called after the client has finished the direct PUT upload.
 */
export async function saveAvatarUrlAction(
  url: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "로그인이 필요합니다." };

  const { error } = await supabaseAdmin
    .from("users")
    .update({ avatar_url: url })
    .eq("id", session.userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/profile/${session.userId}`);
  revalidatePath("/settings/profile");
  revalidatePath("/feed");
  revalidatePath("/home");
  return { ok: true };
}
