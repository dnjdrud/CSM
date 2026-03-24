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

interface UploadConfig {
  bucket: string;
  allowedTypes: string[];
  maxBytes: number;
  typeError: string;
  sizeError: string;
  /** Derive the storage path from the authenticated user's id and resolved file extension. */
  getPath: (userId: string, ext: string) => string;
  /** When true, passes { upsert: true } to createSignedUploadUrl (avatar overwrite). */
  upsert?: boolean;
  /** Optional suffix appended to the public URL (e.g. cache-buster for avatars). */
  publicUrlSuffix?: () => string;
}

/**
 * Shared internal helper — NOT a server action.
 * Centralizes: session guard, MIME validation, size validation,
 * signed-upload-url creation, and public URL derivation.
 */
async function createUploadUrl(
  contentType: string,
  fileSize: number,
  ext: string,
  config: UploadConfig,
): Promise<UploadUrlResult> {
  const session = await getSession();
  if (!session) return { error: "로그인이 필요합니다." };
  if (!config.allowedTypes.includes(contentType)) return { error: config.typeError };
  if (fileSize > config.maxBytes) return { error: config.sizeError };

  const path = config.getPath(session.userId, ext);

  const { data, error } = await supabaseAdmin.storage
    .from(config.bucket)
    .createSignedUploadUrl(path, config.upsert ? { upsert: true } : undefined);

  if (error || !data) return { error: `업로드 URL 생성 실패: ${error?.message}` };

  const { data: pub } = supabaseAdmin.storage.from(config.bucket).getPublicUrl(path);
  const publicUrl = config.publicUrlSuffix
    ? `${pub.publicUrl}${config.publicUrlSuffix()}`
    : pub.publicUrl;

  return { signedUrl: data.signedUrl, publicUrl };
}

/** Random unique path for posts (images and videos). */
function randomPostPath(userId: string, ext: string): string {
  return `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
}

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
  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  return createUploadUrl(contentType, fileSize, ext, {
    bucket: "post-images",
    allowedTypes: ALLOWED_IMAGE_TYPES,
    maxBytes: MAX_IMAGE_BYTES,
    typeError: "JPG, PNG, WEBP 파일만 업로드 가능합니다.",
    sizeError: "파일 크기는 5MB 이하여야 합니다.",
    getPath: randomPostPath,
  });
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
  const ext = filename.split(".").pop()?.toLowerCase() ?? "mp4";
  return createUploadUrl(contentType, fileSize, ext, {
    bucket: "post-videos",
    allowedTypes: ALLOWED_VIDEO_TYPES,
    maxBytes: MAX_VIDEO_BYTES,
    typeError: "MP4, MOV, WebM 파일만 업로드 가능합니다.",
    sizeError: "파일 크기는 200MB 이하여야 합니다.",
    getPath: randomPostPath,
  });
}

/**
 * Issues a signed upload URL for a profile avatar.
 * Uses upsert so the same path is overwritten on re-upload.
 */
export async function getAvatarUploadUrlAction(
  contentType: string,
  fileSize: number,
): Promise<UploadUrlResult> {
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  return createUploadUrl(contentType, fileSize, ext, {
    bucket: "avatars",
    allowedTypes: ALLOWED_IMAGE_TYPES,
    maxBytes: MAX_IMAGE_BYTES,
    typeError: "JPG, PNG, WEBP 파일만 업로드 가능합니다.",
    sizeError: "파일 크기는 5MB 이하여야 합니다.",
    getPath: (userId, ext) => `${userId}/avatar.${ext}`,
    upsert: true,
    // Cache-buster so browsers don't serve the stale previous avatar
    publicUrlSuffix: () => `?t=${Date.now()}`,
  });
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
