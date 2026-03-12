"use server";

import { revalidatePath } from "next/cache";
import { getAuthUserId } from "@/lib/auth/session";
import {
  createSpiritualNote,
  updateSpiritualNote,
  deleteSpiritualNote,
  type SpiritualNoteType,
} from "@/lib/data/spiritualRepository";

function revalidate(userId: string) {
  revalidatePath(`/profile/${userId}`);
}

export async function createSpiritualNoteAction(input: {
  type: SpiritualNoteType;
  title?: string | null;
  content: string;
}): Promise<{ ok: true; id: string } | { error: string }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "로그인이 필요합니다." };
  if (!input.content.trim()) return { error: "내용을 입력해주세요." };

  const result = await createSpiritualNote({ userId, ...input });
  if ("error" in result) return result;

  revalidate(userId);
  return { ok: true, id: result.id };
}

export async function updateSpiritualNoteAction(
  noteId: string,
  input: {
    type: SpiritualNoteType;
    title?: string | null;
    content?: string;
    isAnswered?: boolean;
  }
): Promise<{ ok: true } | { error: string }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "로그인이 필요합니다." };

  const result = await updateSpiritualNote(noteId, userId, input);
  if ("error" in result) return result;

  revalidate(userId);
  return { ok: true };
}

export async function deleteSpiritualNoteAction(
  noteId: string,
  _type: SpiritualNoteType
): Promise<{ ok: true } | { error: string }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "로그인이 필요합니다." };

  const result = await deleteSpiritualNote(noteId, userId);
  if ("error" in result) return result;

  revalidate(userId);
  return { ok: true };
}
