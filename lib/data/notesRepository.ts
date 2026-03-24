import type { Note, NoteType } from "@/lib/domain/types";
import { supabaseServer } from "@/lib/supabase/server";
import { createPost } from "./postRepository";

// ── Select / mapper ───────────────────────────────────────────────────────────

const NOTES_SELECT =
  "id, user_id, type, title, content, tags, is_archived, share_to_profile, published_post_id, status, answer_note, created_at, updated_at";

function rowToNote(r: {
  id: string;
  user_id: string;
  type: string;
  title: string | null;
  content: string;
  tags: string[] | null;
  is_archived: boolean | null;
  share_to_profile: boolean | null;
  published_post_id: string | null;
  status: string | null;
  answer_note: string | null;
  created_at: string | null;
  updated_at: string | null;
}): Note {
  return {
    id: r.id,
    userId: r.user_id,
    type: r.type as NoteType,
    title: r.title ?? undefined,
    content: r.content,
    tags: r.tags ?? [],
    isArchived: r.is_archived ?? false,
    shareToProfile: r.share_to_profile ?? false,
    publishedPostId: r.published_post_id ?? undefined,
    status: (r.status as Note["status"]) ?? undefined,
    answerNote: r.answer_note ?? undefined,
    createdAt: r.created_at ?? new Date().toISOString(),
    updatedAt: r.updated_at ?? undefined,
  };
}

// ── Overview type ─────────────────────────────────────────────────────────────

export interface MySpaceOverview {
  activePrayers: number;
  answeredPrayers: number;
  gratitudeThisWeek: number;
  lastReflection: string | null;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function hasNoteOfTypeToday(params: {
  userId: string;
  type: "PRAYER" | "GRATITUDE";
}): Promise<boolean> {
  const supabase = await supabaseServer();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const startOfToday = start.toISOString();
  const { data, error } = await supabase
    .from("notes")
    .select("id")
    .eq("user_id", params.userId)
    .eq("type", params.type)
    .gte("created_at", startOfToday)
    .limit(1);
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

export async function listNotesByType(params: {
  userId: string;
  type: NoteType;
  limit?: number;
}): Promise<Note[]> {
  const supabase = await supabaseServer();
  const limit = params.limit ?? 50;
  const { data: rows, error } = await supabase
    .from("notes")
    .select(NOTES_SELECT)
    .eq("user_id", params.userId)
    .eq("type", params.type)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (rows ?? []).map(rowToNote);
}

export async function getNoteById(params: { userId: string; noteId: string }): Promise<Note | null> {
  const supabase = await supabaseServer();
  const { data: row, error } = await supabase
    .from("notes")
    .select(NOTES_SELECT)
    .eq("id", params.noteId)
    .eq("user_id", params.userId)
    .single();
  if (error || !row) return null;
  return rowToNote(row);
}

export async function listSharedNotesByUserId(params: {
  userId: string;
  type?: NoteType;
  limit?: number;
}): Promise<Note[]> {
  const supabase = await supabaseServer();
  const limit = params.limit ?? 50;
  let query = supabase
    .from("notes")
    .select(NOTES_SELECT)
    .eq("user_id", params.userId)
    .eq("share_to_profile", true)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (params.type != null) {
    query = query.eq("type", params.type);
  }
  const { data: rows, error } = await query;
  if (error) return [];
  return (rows ?? []).map(rowToNote);
}

export async function listSharedNotesByUserIdPaged(params: {
  userId: string;
  limit: number;
  offset: number;
}): Promise<{ items: Note[]; hasMore: boolean }> {
  const supabase = await supabaseServer();
  const fetchLimit = params.limit + 1;
  const { data: rows, error } = await supabase
    .from("notes")
    .select(NOTES_SELECT)
    .eq("user_id", params.userId)
    .eq("share_to_profile", true)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .range(params.offset, params.offset + fetchLimit - 1);
  if (error || !rows?.length) return { items: [], hasMore: false };
  const hasMore = rows.length > params.limit;
  return { items: (hasMore ? rows.slice(0, params.limit) : rows).map(rowToNote), hasMore };
}

export async function getMySpaceOverview(userId: string): Promise<MySpaceOverview> {
  const supabase = await supabaseServer();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [activeRes, answeredRes, gratitudeRes, lastRes] = await Promise.all([
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "PRAYER")
      .eq("is_archived", false)
      .or("status.eq.ONGOING,status.is.null"),
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "PRAYER")
      .eq("status", "ANSWERED"),
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "GRATITUDE")
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("notes")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    activePrayers: activeRes.count ?? 0,
    answeredPrayers: answeredRes.count ?? 0,
    gratitudeThisWeek: gratitudeRes.count ?? 0,
    lastReflection: lastRes.data?.created_at ?? null,
  };
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createNote(params: {
  userId: string;
  type: NoteType;
  title?: string;
  content: string;
  tags?: string[];
}): Promise<Note> {
  const supabase = await supabaseServer();
  const tags = (params.tags ?? []).slice(0, 5).map((t) => t.trim().toLowerCase()).filter(Boolean);
  const { data: row, error } = await supabase
    .from("notes")
    .insert({
      user_id: params.userId,
      type: params.type,
      title: params.title?.trim() || null,
      content: params.content.trim(),
      tags,
      share_to_profile: false,
      ...(params.type === "PRAYER" && { status: "ONGOING" }),
    })
    .select(NOTES_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return rowToNote(row);
}

export async function updateNote(params: {
  userId: string;
  noteId: string;
  title?: string;
  content?: string;
  tags?: string[];
  isArchived?: boolean;
}): Promise<Note | null> {
  const supabase = await supabaseServer();
  const { data: existing } = await supabase
    .from("notes")
    .select("id, user_id")
    .eq("id", params.noteId)
    .single();
  if (!existing || existing.user_id !== params.userId) return null;
  const updates: Record<string, unknown> = {};
  if (params.title !== undefined) updates.title = params.title.trim() || null;
  if (params.content !== undefined) updates.content = params.content.trim();
  if (params.tags !== undefined)
    updates.tags = params.tags.slice(0, 5).map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (params.isArchived !== undefined) updates.is_archived = params.isArchived;
  updates.updated_at = new Date().toISOString();
  const { data: row, error } = await supabase
    .from("notes")
    .update(updates)
    .eq("id", params.noteId)
    .eq("user_id", params.userId)
    .select(NOTES_SELECT)
    .single();
  if (error || !row) return null;
  return rowToNote(row);
}

export async function deleteNote(params: { userId: string; noteId: string }): Promise<boolean> {
  const supabase = await supabaseServer();
  const { data: existing } = await supabase
    .from("notes")
    .select("id, user_id")
    .eq("id", params.noteId)
    .single();
  if (!existing || existing.user_id !== params.userId) return false;
  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", params.noteId)
    .eq("user_id", params.userId);
  return !error;
}

export async function toggleShareToProfile(params: {
  userId: string;
  noteId: string;
  value: boolean;
}): Promise<boolean> {
  const supabase = await supabaseServer();
  const { data: existing } = await supabase
    .from("notes")
    .select("id, user_id")
    .eq("id", params.noteId)
    .single();
  if (!existing || existing.user_id !== params.userId) return false;
  const { error } = await supabase
    .from("notes")
    .update({ share_to_profile: params.value, updated_at: new Date().toISOString() })
    .eq("id", params.noteId)
    .eq("user_id", params.userId);
  return !error;
}

export async function publishNoteToCommunity(params: {
  userId: string;
  noteId: string;
}): Promise<{ postId: string }> {
  const supabase = await supabaseServer();
  const note = await getNoteById({ userId: params.userId, noteId: params.noteId });
  if (!note) throw new Error("Note not found");
  if (note.publishedPostId) return { postId: note.publishedPostId };
  const post = await createPost({
    authorId: params.userId,
    category: "TESTIMONY",
    content: note.content,
    visibility: "MEMBERS",
    tags: note.tags ?? [],
  });
  const { error } = await supabase
    .from("notes")
    .update({ published_post_id: post.id, updated_at: new Date().toISOString() })
    .eq("id", params.noteId)
    .eq("user_id", params.userId);
  if (error) throw new Error(error.message);
  return { postId: post.id };
}

export async function updatePrayerAnswer(params: {
  userId: string;
  noteId: string;
  answerNote: string;
}): Promise<boolean> {
  const supabase = await supabaseServer();
  const note = await getNoteById({ userId: params.userId, noteId: params.noteId });
  if (!note || note.type !== "PRAYER" || note.status !== "ANSWERED") return false;
  const { error } = await supabase
    .from("notes")
    .update({ answer_note: params.answerNote.trim() || null, updated_at: new Date().toISOString() })
    .eq("id", params.noteId)
    .eq("user_id", params.userId);
  return !error;
}

export async function publishPrayerAsTestimony(params: {
  userId: string;
  noteId: string;
}): Promise<{ postId: string } | null> {
  const supabase = await supabaseServer();
  const note = await getNoteById({ userId: params.userId, noteId: params.noteId });
  if (!note || note.type !== "PRAYER" || note.status !== "ANSWERED" || !note.answerNote?.trim())
    return null;
  if (note.publishedPostId) return { postId: note.publishedPostId };
  const content = `Prayer:\n${note.content}\n\n---\nAnswer:\n${note.answerNote}`;
  const tags = ["testimony", ...(note.tags ?? [])].slice(0, 5);
  const post = await createPost({
    authorId: params.userId,
    category: "TESTIMONY",
    content,
    visibility: "MEMBERS",
    tags,
  });
  const { error } = await supabase
    .from("notes")
    .update({ published_post_id: post.id, updated_at: new Date().toISOString() })
    .eq("id", params.noteId)
    .eq("user_id", params.userId);
  if (error) throw new Error(error.message);
  return { postId: post.id };
}
