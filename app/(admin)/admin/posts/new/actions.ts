"use server";

import { getAdminOrNull } from "@/lib/admin/guard";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { extractYouTubeId } from "@/lib/youtube";
import type { PostCategory, Visibility } from "@/lib/domain/types";

const CATEGORIES: PostCategory[] = ["PRAYER", "DEVOTIONAL", "MINISTRY", "TESTIMONY"];
const VISIBILITIES: Visibility[] = ["PUBLIC", "MEMBERS", "FOLLOWERS", "PRIVATE"];

function parseTags(tagsInput: string): string[] {
  return tagsInput
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5);
}

export type CreatePostResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createPostAction(formData: FormData): Promise<CreatePostResult> {
  const admin = await getAdminOrNull();
  if (!admin) {
    return { ok: false, error: "권한이 없습니다. 관리자 계정으로 로그인해 주세요." };
  }

  const title = formData.get("title")?.toString()?.trim();
  if (!title) {
    return { ok: false, error: "제목을 입력해 주세요." };
  }

  const content = formData.get("content")?.toString()?.trim() ?? "";
  const category = (formData.get("category")?.toString() ?? "PRAYER") as PostCategory;
  const visibility = (formData.get("visibility")?.toString() ?? "MEMBERS") as Visibility;
  const tagsInput = formData.get("tags")?.toString() ?? "";
  const youtubeUrl = formData.get("youtubeUrl")?.toString()?.trim();
  const thumbnailUrl = formData.get("thumbnailUrl")?.toString()?.trim() || null;

  if (!CATEGORIES.includes(category)) {
    return { ok: false, error: "유효한 카테고리를 선택해 주세요." };
  }
  if (!VISIBILITIES.includes(visibility)) {
    return { ok: false, error: "유효한 공개 범위를 선택해 주세요." };
  }

  let youtubeId: string | null = null;
  if (youtubeUrl) {
    youtubeId = extractYouTubeId(youtubeUrl);
    if (!youtubeId) {
      return {
        ok: false,
        error: "올바른 YouTube URL을 입력해 주세요. (예: https://www.youtube.com/watch?v=VIDEOID 또는 https://youtu.be/VIDEOID)",
      };
    }
  }

  const client = getSupabaseAdmin();
  if (!client) {
    return { ok: false, error: "서버 설정 오류입니다. 관리자에게 문의해 주세요." };
  }

  const tags = parseTags(tagsInput);

  const payload = {
    author_id: admin.userId,
    title,
    content: content || "(내용 없음)",
    category,
    visibility,
    tags,
    youtube_id: youtubeId,
    thumbnail_url: thumbnailUrl,
  };

  const { data, error } = await client
    .from("posts")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      error: error.message || "게시물 저장에 실패했습니다. 다시 시도해 주세요.",
    };
  }

  const id = data?.id;
  if (!id) {
    return { ok: false, error: "저장 후 ID를 받지 못했습니다. 다시 시도해 주세요." };
  }

  return { ok: true, id };
}
