"use server";

import { revalidatePath } from "next/cache";
import { getAdminOrNull } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { ADMIN_ACTION, AUDIT_TARGET_TYPE } from "@/lib/admin/constants";
import {
  listSignupRequests,
  approveAndCreateUser,
  rejectSignupRequest,
} from "@/lib/data/signupRepository";
import { supabaseServer } from "@/lib/supabase/server";
import { sendApprovalLoginEmail } from "@/lib/email/send";
import { createMagicLink } from "@/lib/auth/magicLink";
import { logError } from "@/lib/logging/systemLogger";
import { getBaseUrlForLinks } from "@/lib/url/site";
import type { SignupRequestStatus } from "@/lib/domain/types";

export async function listSignupRequestsAction(
  status?: SignupRequestStatus
): Promise<{ requests: Awaited<ReturnType<typeof listSignupRequests>>; error?: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { requests: [], error: "Unauthorized" };
  const supabase = await supabaseServer();
  const requests = await listSignupRequests(status, supabase);
  return { requests };
}

/** Approve: immediately creates account + sends magic link login email. */
export async function approveSignupRequestAction(
  requestId: string
): Promise<{ ok: true; emailError?: string } | { error: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { error: "Unauthorized" };

  const supabase = await supabaseServer();

  try {
    const result = await approveAndCreateUser(admin.userId, requestId, supabase);
    if ("error" in result) return { error: result.error };

    let emailError: string | undefined;
    try {
      const magicLink = await createMagicLink(result.email);
      if ("error" in magicLink) throw new Error(magicLink.error);
      const loginUrl = `${getBaseUrlForLinks()}/auth/verify-magic?id=${magicLink.id}&token=${encodeURIComponent(magicLink.rawToken)}`;
      await sendApprovalLoginEmail(result.email, loginUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      emailError = msg;
      logError("SERVER_ACTION", "[approveSignupRequest] sendApprovalLoginEmail failed", {
        requestId,
        email: result.email,
        error: msg,
      });
    }

    await logAdminAction({
      actorId: admin.userId,
      action: ADMIN_ACTION.APPROVE_SIGNUP_REQUEST,
      targetType: AUDIT_TARGET_TYPE.SIGNUP_REQUEST,
      targetId: requestId,
      metadata: { email: result.email },
    });

    revalidatePath("/admin/signup-requests");
    revalidatePath("/admin/signups");
    return { ok: true, emailError };
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
