"use server";

import { getSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";

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

  const supabase = await supabaseServer();
  const { data, error } = await supabase.storage
    .from("post-images")
    .createSignedUploadUrl(path);

  if (error || !data) return { error: `업로드 URL 생성 실패: ${error?.message}` };

  const { data: pub } = supabase.storage.from("post-images").getPublicUrl(path);
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

  const supabase = await supabaseServer();
  const { data, error } = await supabase.storage
    .from("post-videos")
    .createSignedUploadUrl(path);

  if (error || !data) return { error: `업로드 URL 생성 실패: ${error?.message}` };

  const { data: pub } = supabase.storage.from("post-videos").getPublicUrl(path);
  return { signedUrl: data.signedUrl, publicUrl: pub.publicUrl };
}
