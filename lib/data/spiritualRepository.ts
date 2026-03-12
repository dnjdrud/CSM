/**
 * spiritualRepository — CRUD for spiritual_notes table.
 * All operations are owner-scoped: Supabase RLS enforces user_id = auth.uid(),
 * and we add explicit .eq("user_id", userId) as a defence-in-depth guard.
 *
 * This is intentionally separate from the main repository to prevent any
 * possibility of spiritual notes appearing in public feed queries.
 */

import { supabaseServer } from "@/lib/supabase/server";

export type SpiritualNoteType = "prayer" | "life";

export type SpiritualNote = {
  id: string;
  userId: string;
  type: SpiritualNoteType;
  title: string | null;
  content: string;
  /** Only meaningful for prayer notes — marks a prayer as answered. */
  isAnswered: boolean;
  createdAt: string;
  updatedAt: string;
};

const SELECT =
  "id, user_id, type, title, content, is_answered, created_at, updated_at" as const;

type Row = {
  id: string;
  user_id: string;
  type: string;
  title: string | null;
  content: string;
  is_answered: boolean;
  created_at: string;
  updated_at: string;
};

function rowToNote(r: Row): SpiritualNote {
  return {
    id: r.id,
    userId: r.user_id,
    type: r.type as SpiritualNoteType,
    title: r.title,
    content: r.content,
    isAnswered: r.is_answered,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** List all notes for a user+type, newest first. Max 50. */
export async function listSpiritualNotes(
  userId: string,
  type: SpiritualNoteType
): Promise<SpiritualNote[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("spiritual_notes")
    .select(SELECT)
    .eq("user_id", userId)
    .eq("type", type)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[spiritualRepository] listSpiritualNotes:", error.message);
    return [];
  }
  return (data ?? []).map(rowToNote);
}

/** Create a new note. Returns the new id on success. */
export async function createSpiritualNote(input: {
  userId: string;
  type: SpiritualNoteType;
  title?: string | null;
  content: string;
}): Promise<{ id: string } | { error: string }> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("spiritual_notes")
    .insert({
      user_id: input.userId,
      type: input.type,
      title: input.title?.trim() || null,
      content: input.content.trim(),
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "저장에 실패했습니다." };
  return { id: data.id };
}

/** Update an existing note. Only owner can update (RLS + explicit userId check). */
export async function updateSpiritualNote(
  noteId: string,
  userId: string,
  input: {
    title?: string | null;
    content?: string;
    isAnswered?: boolean;
  }
): Promise<{ ok: true } | { error: string }> {
  const supabase = await supabaseServer();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.title !== undefined) updates.title = input.title?.trim() || null;
  if (input.content !== undefined) updates.content = input.content.trim();
  if (input.isAnswered !== undefined) updates.is_answered = input.isAnswered;

  const { error } = await supabase
    .from("spiritual_notes")
    .update(updates)
    .eq("id", noteId)
    .eq("user_id", userId);

  if (error) return { error: error.message };
  return { ok: true };
}

/** Delete a note. Only owner can delete (RLS + explicit userId check). */
export async function deleteSpiritualNote(
  noteId: string,
  userId: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("spiritual_notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", userId);

  if (error) return { error: error.message };
  return { ok: true };
}
