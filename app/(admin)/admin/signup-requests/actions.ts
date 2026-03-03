"use server";

import { getAdminOrNull } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { ADMIN_ACTION, AUDIT_TARGET_TYPE } from "@/lib/admin/constants";
import {
  listSignupRequests,
  approveSignupRequest,
  rejectSignupRequest,
} from "@/lib/data/signupRepository";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { SignupRequestStatus } from "@/lib/domain/types";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  process.env.APP_URL ||
  "http://localhost:3000";

export async function listSignupRequestsAction(
  status?: SignupRequestStatus
): Promise<{ requests: Awaited<ReturnType<typeof listSignupRequests>>; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { requests: [], error: "Unauthorized" };
  const requests = await listSignupRequests(status);
  return { requests };
}

export async function approveSignupRequestAction(
  requestId: string
): Promise<{ ok: true } | { error: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { error: "Unauthorized" };

  const result = await approveSignupRequest(admin.userId, requestId);
  if (!result) return { error: "Request not found or not pending." };

  const link = `${APP_URL.replace(/\/$/, "")}/onboarding/complete?token=${encodeURIComponent(result.token)}`;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.functions.invoke("send-approval-email", {
      body: { email: result.email, link },
    });
    if (error) {
      console.error("[approveSignupRequest] Edge function error", error);
      return { error: "Approved but failed to send email. You can share the link manually." };
    }
  }

  await logAdminAction({
    actorId: admin.userId,
    action: ADMIN_ACTION.APPROVE_SIGNUP_REQUEST,
    targetType: AUDIT_TARGET_TYPE.SIGNUP_REQUEST,
    targetId: requestId,
    metadata: { email: result.email },
  });

  return { ok: true };
}

export async function rejectSignupRequestAction(
  requestId: string,
  note?: string | null
): Promise<{ ok: true } | { error: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { error: "Unauthorized" };

  const ok = await rejectSignupRequest(admin.userId, requestId, note);
  if (!ok) return { error: "Request not found or already processed." };

  await logAdminAction({
    actorId: admin.userId,
    action: ADMIN_ACTION.REJECT_SIGNUP_REQUEST,
    targetType: AUDIT_TARGET_TYPE.SIGNUP_REQUEST,
    targetId: requestId,
    metadata: { note: note ?? undefined },
  });

  return { ok: true };
}
