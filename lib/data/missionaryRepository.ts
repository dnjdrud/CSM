import type {
  MissionaryProject,
  MissionaryProjectStatus,
  MissionaryReport,
  MissionarySupporter,
  SupportType,
} from "@/lib/domain/types";
import { supabaseServer } from "@/lib/supabase/server";
import { rowToUser } from "./_internal/postHelpers";

// ── Row mapper ────────────────────────────────────────────────────────────────

function rowToMissionaryProject(r: {
  id: string;
  missionary_id: string;
  title: string;
  country?: string | null;
  field?: string | null;
  description?: string | null;
  status: string;
  created_at: string;
  users?: { id: string; name: string | null; role: string | null; bio: string | null; affiliation: string | null; created_at: string | null; avatar_url?: string | null } | null;
  missionary_supporters?: { count: number }[] | null;
  viewer_supports?: boolean;
}): MissionaryProject {
  return {
    id: r.id,
    missionaryId: r.missionary_id,
    title: r.title,
    country: r.country ?? null,
    field: r.field ?? null,
    description: r.description ?? null,
    status: r.status as MissionaryProjectStatus,
    createdAt: r.created_at,
    missionary: r.users ? rowToUser(r.users as any) : undefined,
    supporterCount: r.missionary_supporters?.[0]?.count ?? 0,
    hasPrayerSupport: r.viewer_supports ?? false,
  };
}

// ── Project queries ───────────────────────────────────────────────────────────

export async function listMissionaryProjects(
  opts: { missionaryId?: string; viewerId?: string | null; limit?: number } = {}
): Promise<MissionaryProject[]> {
  const supabase = await supabaseServer();
  const limit = opts.limit ?? 30;

  let q = supabase
    .from("missionary_projects")
    .select("*, users(id,name,role,bio,affiliation,created_at,avatar_url), missionary_supporters(count)")
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (opts.missionaryId) q = q.eq("missionary_id", opts.missionaryId);

  const { data, error } = await q;
  if (error) { console.error("[listMissionaryProjects]", error.message); return []; }

  const rows = (data ?? []) as any[];
  if (!opts.viewerId) return rows.map(rowToMissionaryProject);

  const ids = rows.map((r: any) => r.id);
  const { data: supports } = await supabase
    .from("missionary_supporters")
    .select("project_id")
    .in("project_id", ids)
    .eq("user_id", opts.viewerId);
  const supportSet = new Set((supports ?? []).map((s: any) => s.project_id));
  return rows.map((r: any) => rowToMissionaryProject({ ...r, viewer_supports: supportSet.has(r.id) }));
}

export async function getMissionaryProjectById(
  id: string,
  viewerId?: string | null
): Promise<MissionaryProject | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("missionary_projects")
    .select("*, users(id,name,role,bio,affiliation,created_at,avatar_url), missionary_supporters(count)")
    .eq("id", id)
    .single();
  if (error || !data) return null;

  let viewerSupports = false;
  if (viewerId) {
    const { data: s } = await supabase
      .from("missionary_supporters")
      .select("id")
      .eq("project_id", id)
      .eq("user_id", viewerId)
      .single();
    viewerSupports = !!s;
  }
  return rowToMissionaryProject({ ...(data as any), viewer_supports: viewerSupports });
}

// ── Project mutations ─────────────────────────────────────────────────────────

export async function createMissionaryProject(input: {
  missionaryId: string;
  title: string;
  country?: string;
  field?: string;
  description?: string;
}): Promise<MissionaryProject> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("missionary_projects")
    .insert({
      missionary_id: input.missionaryId,
      title: input.title.trim(),
      country: input.country?.trim() ?? null,
      field: input.field?.trim() ?? null,
      description: input.description?.trim() ?? null,
    })
    .select("*, users(id,name,role,bio,affiliation,created_at,avatar_url), missionary_supporters(count)")
    .single();
  if (error) throw new Error(error.message);
  return rowToMissionaryProject(data as any);
}

// ── Reports ───────────────────────────────────────────────────────────────────

export async function listMissionaryReports(projectId: string): Promise<MissionaryReport[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("missionary_reports")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((r: any) => ({
    id: r.id,
    projectId: r.project_id,
    content: r.content,
    createdAt: r.created_at,
  }));
}

export async function createMissionaryReport(
  projectId: string,
  content: string
): Promise<MissionaryReport> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("missionary_reports")
    .insert({ project_id: projectId, content: content.trim() })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, projectId: data.project_id, content: data.content, createdAt: data.created_at };
}

// ── Supporters ────────────────────────────────────────────────────────────────

export async function listMissionarySupporters(projectId: string): Promise<MissionarySupporter[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("missionary_supporters")
    .select("*, users(id,name,role,bio,affiliation,created_at,avatar_url)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((r: any) => ({
    id: r.id,
    projectId: r.project_id,
    userId: r.user_id,
    supportType: r.support_type as SupportType,
    createdAt: r.created_at,
    user: r.users ? rowToUser(r.users) : undefined,
  }));
}

export async function toggleMissionarySupport(
  projectId: string,
  userId: string
): Promise<"added" | "removed"> {
  const supabase = await supabaseServer();
  const { data: existing } = await supabase
    .from("missionary_supporters")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .single();
  if (existing) {
    await supabase.from("missionary_supporters").delete().eq("id", existing.id);
    return "removed";
  }
  await supabase
    .from("missionary_supporters")
    .insert({ project_id: projectId, user_id: userId, support_type: "PRAYER" });
  return "added";
}
