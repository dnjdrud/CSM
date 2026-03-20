"use server";

import { getSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";

const BUCKET = "post-videos";
const MAX_BYTES = 200 * 1024 * 1024; // 200 MB server-side limit
const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

/**
 * Upload a short video to Supabase Storage.
 * Receives a FormData with field "file".
 * Returns the public URL on success.
 *
 * Path: shorts/{userId}/{timestamp}-{random}.{ext}
 */
export async function uploadPostVideoAction(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "로그인이 필요합니다." };

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "파일이 없습니다." };
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "MP4, MOV, WebM 파일만 업로드 가능합니다." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "파일 크기는 200MB 이하여야 합니다." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
  const path = `${session.userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const supabase = await supabaseServer();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return { error: `업로드 실패: ${error.message}` };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
