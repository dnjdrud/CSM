/**
 * Admin audit logging. All admin mutating actions must call logAdminAction.
 * logSignupComplete: server-only (service role) for COMPLETE_SIGNUP when no admin session.
 */
import { ADMIN_ACTION } from "@/lib/admin/constants";
import type { AdminActionType, AuditTargetType } from "@/lib/admin/constants";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
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

/** Log COMPLETE_SIGNUP (service role). Call after new user is created via approval flow. */
export async function logSignupComplete(newUserId: string, requestId: string, email: string): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  await admin.from("audit_logs").insert({
    actor_id: newUserId,
    action: ADMIN_ACTION.COMPLETE_SIGNUP,
    target_type: "user",
    target_id: newUserId,
    metadata: { requestId, email },
  });
}
