/**
 * System logs read access. Uses supabaseServer(); RLS allows only ADMIN.
 */
import { supabaseServer } from "@/lib/supabase/server";

export type SystemLogRow = {
  id: string;
  level: string;
  source: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function getSystemLogs(options: {
  limit?: number;
  level?: string;
}): Promise<SystemLogRow[]> {
  const supabase = await supabaseServer();
  let q = supabase
    .from("system_logs")
    .select("id, level, source, message, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 100);
  if (options.level && ["INFO", "WARN", "ERROR"].includes(options.level)) {
    q = q.eq("level", options.level);
  }
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as SystemLogRow[];
}
