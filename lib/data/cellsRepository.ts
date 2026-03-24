import type { Cell, CellMessage } from "@/lib/domain/types";
import { supabaseServer } from "@/lib/supabase/server";

// ── Row mappers ───────────────────────────────────────────────────────────────

function rowToCell(r: {
  id: string;
  type: string;
  title: string;
  creator_id: string;
  topic_tags: string[] | null;
  created_at: string | null;
  cell_memberships?: { count: number }[] | null;
}): Cell {
  return {
    id: r.id,
    type: r.type as Cell["type"],
    title: r.title,
    creatorId: r.creator_id,
    topicTags: r.topic_tags ?? [],
    createdAt: r.created_at ?? new Date().toISOString(),
    memberCount: r.cell_memberships?.[0]?.count,
  };
}

function rowToCellMessage(r: {
  id: string;
  cell_id: string;
  author_id: string;
  content: string;
  created_at: string | null;
  users?: { name: string } | null;
}): CellMessage {
  return {
    id: r.id,
    cellId: r.cell_id,
    authorId: r.author_id,
    authorName: r.users?.name ?? "Unknown",
    content: r.content,
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function listOpenCells(): Promise<Cell[]> {
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase
      .from("cells")
      .select("*, cell_memberships(count)")
      .eq("type", "OPEN")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[listOpenCells]", error.message);
      return [];
    }
    return (data ?? []).map(rowToCell);
  } catch (e) {
    console.error("[listOpenCells] caught error:", e);
    return [];
  }
}

export async function getCellById(cellId: string): Promise<Cell | null> {
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.from("cells").select("*").eq("id", cellId).single();
    if (error || !data) {
      if (error) console.error("[getCellById]", error.message);
      return null;
    }
    return rowToCell(data as any);
  } catch (e) {
    console.error("[getCellById] caught error:", e);
    return null;
  }
}

export async function listCellsByUserId(userId: string): Promise<Cell[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("cell_memberships")
    .select("cells(*, cell_memberships(count))")
    .eq("user_id", userId);
  if (error) { console.error("[listCellsByUserId]", error.message); return []; }
  return (data ?? [])
    .map((row: any) => row.cells)
    .filter(Boolean)
    .map(rowToCell);
}

export async function isMember(cellId: string, userId: string): Promise<boolean> {
  try {
    const supabase = await supabaseServer();
    const { data: cell } = await supabase.from("cells").select("type").eq("id", cellId).single();
    if (cell?.type === "OPEN") return true;
    const { data: rows, error } = await supabase
      .from("cell_memberships")
      .select("user_id")
      .eq("cell_id", cellId)
      .eq("user_id", userId)
      .limit(1);
    if (error) {
      console.error("[isMember]", error.message);
      return false;
    }
    return (rows?.length ?? 0) > 0;
  } catch (e) {
    console.error("[isMember] caught error:", e);
    return false;
  }
}

export async function getCellMessages(cellId: string, limit = 50): Promise<CellMessage[]> {
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase
      .from("cell_messages")
      .select("*, users(name)")
      .eq("cell_id", cellId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("[getCellMessages]", error.message);
      return [];
    }
    return (data ?? []).map(rowToCellMessage).reverse();
  } catch (e) {
    console.error("[getCellMessages] caught error:", e);
    return [];
  }
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createCell(input: {
  creatorId: string;
  type: Cell["type"];
  title: string;
  topicTags?: string[];
}): Promise<Cell> {
  const supabase = await supabaseServer();
  const payload = {
    creator_id: input.creatorId,
    type: input.type,
    title: input.title.trim(),
    topic_tags: input.topicTags ?? [],
  };
  const { data, error } = await supabase.from("cells").insert(payload).select("*").single();
  if (error) {
    console.error("[createCell]", error.message, payload);
    throw new Error(error.message);
  }
  return rowToCell(data as any);
}

export async function joinCell(cellId: string, userId: string): Promise<void> {
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("cell_memberships")
    .insert({ cell_id: cellId, user_id: userId });
  if (error && !error.message.includes("duplicate")) {
    console.error("[joinCell]", error.message);
    throw new Error(error.message);
  }
}

export async function leaveCell(cellId: string, userId: string): Promise<void> {
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("cell_memberships")
    .delete()
    .match({ cell_id: cellId, user_id: userId });
  if (error) {
    console.error("[leaveCell]", error.message);
    throw new Error(error.message);
  }
}

export async function postCellMessage(
  cellId: string,
  authorId: string,
  content: string
): Promise<CellMessage> {
  const supabase = await supabaseServer();
  const payload = { cell_id: cellId, author_id: authorId, content: content.trim() };
  const { data, error } = await supabase
    .from("cell_messages")
    .insert(payload)
    .select("*")
    .single();
  if (error) {
    console.error("[postCellMessage]", error.message, payload);
    throw new Error(error.message);
  }
  return rowToCellMessage(data as any);
}
