"use server";

import { getAuthUserId } from "@/lib/auth/session";
import { listFollowing } from "@/lib/data/repository";
import { sendMessageAction } from "@/app/(app)/messages/actions";
import { supabaseServer } from "@/lib/supabase/server";
import type { User } from "@/lib/domain/types";
import type { SpiritualNoteType } from "@/lib/data/spiritualRepository";

/** 내가 팔로우하는 사용자 목록 반환 (수신자 선택 UI용). */
export async function fetchFollowingUsersAction(): Promise<
  { users: Pick<User, "id" | "name" | "avatarUrl" | "role">[] } | { error: string }
> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "로그인이 필요합니다." };

  const users = await listFollowing(userId);
  return {
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl ?? null,
      role: u.role,
    })),
  };
}

/**
 * 영성 기록을 DM으로 공유.
 * - 기록 소유권 검증 (owner_id = auth.uid())
 * - 기존 sendMessageAction 재사용 (rate limit + notification 포함)
 * - 내용은 구조화된 텍스트로 포맷
 */
export async function shareSpiritualNoteAction(input: {
  noteId: string;
  recipientId: string;
}): Promise<{ ok: true } | { error: string }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "로그인이 필요합니다." };
  if (userId === input.recipientId) return { error: "자신에게는 보낼 수 없습니다." };

  // 소유권 검증 — 본인 기록만 공유 가능
  const supabase = await supabaseServer();
  const { data: note, error: noteError } = await supabase
    .from("spiritual_notes")
    .select("id, type, title, content, user_id")
    .eq("id", input.noteId)
    .eq("user_id", userId) // RLS + explicit owner check
    .maybeSingle();

  if (noteError || !note) {
    return { error: "기록을 찾을 수 없거나 접근 권한이 없습니다." };
  }

  // DM 메시지 포맷
  const typeLabel = (note.type as SpiritualNoteType) === "prayer" ? "🙏 기도제목 공유" : "📔 삶 기록 공유";
  const preview =
    note.content.length > 200
      ? note.content.slice(0, 200) + "..."
      : note.content;

  const lines: string[] = [typeLabel, ""];
  if (note.title) {
    lines.push(`제목: ${note.title}`, "");
  }
  lines.push(preview, "", "— Cellah 영성관리에서 공유됨");

  const messageContent = lines.join("\n");

  const result = await sendMessageAction(input.recipientId, messageContent);
  if (!result.ok) return { error: result.error ?? "전송에 실패했습니다." };

  return { ok: true };
}
