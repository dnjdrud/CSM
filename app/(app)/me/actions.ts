"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  listNotesByType,
  createNote,
  updateNote,
  deleteNote,
  getNoteById,
  toggleShareToProfile,
  publishNoteToCommunity,
  updatePrayerAnswer,
  publishPrayerAsTestimony,
} from "@/lib/data/repository";
import type { NoteType } from "@/lib/domain/types";

export async function listNotesAction(type: NoteType) {
  const session = await getSession();
  if (!session) redirect("/onboarding");
  return listNotesByType({ userId: session.userId, type, limit: 100 });
}

export async function createNoteAction(
  type: NoteType,
  content: string,
  title?: string,
  tags?: string[]
): Promise<{ ok: boolean; error?: string; noteId?: string }> {
  const session = await getSession();
  if (!session) redirect("/onboarding");
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Content is required" };
  try {
    const note = await createNote({
      userId: session.userId,
      type,
      title: title?.trim(),
      content: trimmed,
      tags: tags?.slice(0, 5),
    });
    revalidatePath("/me");
    return { ok: true, noteId: note.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create note" };
  }
}

export async function updateNoteAction(
  noteId: string,
  data: { title?: string; content?: string; tags?: string[] }
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) redirect("/onboarding");
  if (data.content !== undefined && !data.content.trim()) return { ok: false, error: "Content is required" };
  const updated = await updateNote({
    userId: session.userId,
    noteId,
    title: data.title,
    content: data.content,
    tags: data.tags,
  });
  if (!updated) return { ok: false, error: "Not found or not allowed" };
  revalidatePath("/me");
  return { ok: true };
}

export async function deleteNoteAction(noteId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) redirect("/onboarding");
  const ok = await deleteNote({ userId: session.userId, noteId });
  if (!ok) return { ok: false, error: "Not found or not allowed" };
  revalidatePath("/me");
  return { ok: true };
}

export async function getNoteByIdAction(noteId: string) {
  const session = await getSession();
  if (!session) redirect("/onboarding");
  return getNoteById({ userId: session.userId, noteId });
}

export async function toggleShareToProfileAction(noteId: string, value: boolean): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) redirect("/onboarding");
  const ok = await toggleShareToProfile({ userId: session.userId, noteId, value });
  if (!ok) return { ok: false, error: "Not found or not allowed" };
  revalidatePath("/me");
  revalidatePath(`/profile/${session.userId}`);
  return { ok: true };
}

export async function publishNoteAction(noteId: string): Promise<{ ok: boolean; error?: string; postId?: string }> {
  const session = await getSession();
  if (!session) redirect("/onboarding");
  try {
    const { postId } = await publishNoteToCommunity({ userId: session.userId, noteId });
    revalidatePath("/me");
    revalidatePath("/feed");
    return { ok: true, postId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to publish" };
  }
}

export async function updatePrayerAnswerAction(
  noteId: string,
  answerNote: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) redirect("/onboarding");
  const ok = await updatePrayerAnswer({
    userId: session.userId,
    noteId,
    answerNote,
  });
  if (!ok) return { ok: false, error: "Not found or not allowed" };
  revalidatePath("/me");
  return { ok: true };
}

export async function publishTestimonyAction(noteId: string): Promise<{ ok: boolean; error?: string; postId?: string }> {
  const session = await getSession();
  if (!session) redirect("/onboarding");
  try {
    const result = await publishPrayerAsTestimony({ userId: session.userId, noteId });
    if (!result) return { ok: false, error: "Not found or not allowed" };
    revalidatePath("/me");
    revalidatePath("/feed");
    return { ok: true, postId: result.postId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to share" };
  }
}
