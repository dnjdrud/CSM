"use server";

import { getSession } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase/server";

const BUCKET = "post-images";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Upload a single post image to Supabase Storage.
 * Receives a FormData with field "file".
 * Returns the public URL on success.
 *
 * Path: posts/{userId}/{timestamp}-{random}.{ext}
 */
export async function uploadPostImageAction(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "로그인이 필요합니다." };

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "파일이 없습니다." };
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "JPG, PNG, WEBP 파일만 업로드 가능합니다." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "파일 크기는 5MB 이하여야 합니다." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
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
