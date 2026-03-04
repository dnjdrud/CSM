"use server";

import { revalidatePath } from "next/cache";
import { getAdminOrNull } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { ADMIN_ACTION, AUDIT_TARGET_TYPE } from "@/lib/admin/constants";
import {
  listSignupRequests,
  approveSignupRequest,
  rejectSignupRequest,
} from "@/lib/data/signupRepository";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
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
  const supabase = await supabaseServer();
  const requests = await listSignupRequests(status, supabase);
  return { requests };
}

/** Approve: DB update + token 생성은 관리자 세션(RLS)으로 항상 수행. 이메일은 선택(실패해도 승인 성공). */
export async function approveSignupRequestAction(
  requestId: string
): Promise<{ ok: true; link?: string } | { error: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { error: "Unauthorized" };

  const supabase = await supabaseServer();

  try {
    const result = await approveSignupRequest(admin.userId, requestId, supabase);
    if (!result) {
      return { error: "Request not found or not pending." };
    }

    const link = `${APP_URL.replace(/\/$/, "")}/auth/complete?token=${encodeURIComponent(result.token)}`;

    const adminClient = getSupabaseAdmin();
    if (adminClient) {
      const { error } = await adminClient.functions.invoke("send-approval-email", {
        body: { email: result.email, link },
      });
      if (error) {
        console.error("[approveSignupRequest] send-approval-email error", error);
      }
    }

    await logAdminAction({
      actorId: admin.userId,
      action: ADMIN_ACTION.APPROVE_SIGNUP_REQUEST,
      targetType: AUDIT_TARGET_TYPE.SIGNUP_REQUEST,
      targetId: requestId,
      metadata: { email: result.email, link },
    });

    revalidatePath("/admin/signup-requests");
    revalidatePath("/admin/signups");
    return { ok: true, link };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[approveSignupRequest] threw", e);
    return { error: msg };
  }
}

export async function rejectSignupRequestAction(
  requestId: string,
  note?: string | null
): Promise<{ ok: true } | { error: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { error: "Unauthorized" };

  const supabase = await supabaseServer();
  const ok = await rejectSignupRequest(admin.userId, requestId, note, supabase);
  if (!ok) return { error: "Request not found or already processed." };

  await logAdminAction({
    actorId: admin.userId,
    action: ADMIN_ACTION.REJECT_SIGNUP_REQUEST,
    targetType: AUDIT_TARGET_TYPE.SIGNUP_REQUEST,
    targetId: requestId,
    metadata: { note: note ?? undefined },
  });

  revalidatePath("/admin/signup-requests");
  revalidatePath("/admin/signups");
  return { ok: true };
}
