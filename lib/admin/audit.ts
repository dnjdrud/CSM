/**
 * Admin audit logging. All admin mutating actions must call logAdminAction.
 */
import type { AdminActionType, AuditTargetType } from "@/lib/admin/constants";
import { supabaseServer } from "@/lib/supabase/server";

export interface AuditEntryParams {
  actorId: string;
  action: AdminActionType;
  targetType: AuditTargetType;
  targetId: string | null;
  metadata?: Record<string, unknown>;
}

export async function logAdminAction(params: AuditEntryParams): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.from("audit_logs").insert({
    actor_id: params.actorId,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId,
    metadata: params.metadata ?? {},
  });
}
