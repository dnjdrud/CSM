"use server";

import { redirect } from "next/navigation";
import { createUserWithInvite } from "@/lib/data/repository";
import { getAuthUserId, getAuthUserEmail } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { validateInviteCode, validateInviteCodeForSignup } from "@/lib/data/inviteRepository";
import { createSignupRequest } from "@/lib/data/signupRepository";
import { isRateLimited, recordAttempt } from "@/lib/auth/inviteRateLimit";
import { setInviteCookie, getInviteCookie, clearInviteCookie } from "@/lib/invites/inviteGate";
import { INVITE_ONLY } from "@/lib/config/features";
import { isAdminEmail, canSkipInviteForOnboarding } from "@/lib/admin/bootstrap";
import { createAdminProfileForOnboarding } from "@/lib/data/signupRepository";
import {
  INVITE_CODE_REQUIRED,
  INVITE_CODE_INVALID,
} from "./_lib/inviteUi";
import type { UserRole, InviteValidationOutcome } from "@/lib/domain/types";

const ALLOWED_ROLES: UserRole[] = ["LAY", "MINISTRY_WORKER", "PASTOR", "MISSIONARY", "SEMINARIAN"];

export type OnboardingResult = { error?: string; redirect?: string } | void;

/** Log invite failure without exposing full code (last 4 chars only). */
function logInviteFailure(reason: InviteValidationOutcome, codeSuffix: string): void {
  console.warn(`[onboarding] invite validation failed reason=${reason} code_suffix=…${codeSuffix}`);
}

const OUTCOME_MESSAGES: Record<InviteValidationOutcome, string> = {
  VALID: "",
  INVALID: "That invite code doesn't look right.",
  EXPIRED: "This invite has expired. Please request a new one.",
  USED: "This invite has already been used.",
  RATE_LIMITED: "Too many attempts. Please try again in a minute.",
};

/** Submit a signup request (approval flow). No Auth user created until admin approves and user completes signup. */
export async function requestSignupAction(formData: {
  email: string;
  name?: string | null;
  role: UserRole;
  church?: string | null;
  bio?: string | null;
  affiliation?: string | null;
}): Promise<{ ok: true } | { errorMessage: string }> {
  try {
    const result = await createSignupRequest(formData);
    if ("error" in result) {
      if (result.error === "ALREADY_MEMBER") {
        return { errorMessage: "This email is already a member. Please sign in." };
      }
      return { errorMessage: "Could not submit request. Please try again." };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Something went wrong.";
    if (msg.includes("not configured") || msg.includes("Server not configured")) {
      return { errorMessage: "Signup is not configured on this server. Please contact support." };
    }
    return { errorMessage: msg };
  }
}

/** Pre–magic link: validate invite (when INVITE_ONLY), set cookie, return ok or error. Does not send email. */
export async function requestMagicLinkAction(params: {
  email: string;
  inviteCode?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = params.email?.trim();
  if (!email) return { ok: false, error: "Email is required." };

  if (INVITE_ONLY && !isAdminEmail(email)) {
    const code = params.inviteCode?.trim();
    if (!code) return { ok: false, error: INVITE_CODE_REQUIRED };
    const outcome = await validateInviteCodeForSignup(code);
    if (outcome !== "VALID") {
      return { ok: false, error: INVITE_CODE_INVALID };
    }
    await setInviteCookie(code);
  }

  return { ok: true };
}

/** Gate step: validate invite code only. Does not consume. Returns outcome for UX. */
export async function validateInviteCodeForGate(
  code: string
): Promise<{ outcome: InviteValidationOutcome }> {
  const trimmed = code.trim();
  const authUserId = await getAuthUserId();
  if (!authUserId) {
    return { outcome: "INVALID" };
  }
  if (isRateLimited(authUserId)) {
    return { outcome: "RATE_LIMITED" };
  }
  const outcome = await validateInviteCode(trimmed);
  recordAttempt(authUserId);
  if (outcome !== "VALID") {
    const suffix = trimmed.length >= 4 ? trimmed.slice(-4) : "****";
    logInviteFailure(outcome, suffix);
  }
  return { outcome };
}

/** Onboarding: when INVITE_ONLY use code from cookie; else from form. Re-validate, then create profile (RPC consumes code atomically). */
export async function submitOnboarding(formData: {
  inviteCode?: string;
  name: string;
  role: UserRole;
  bio?: string;
  affiliation?: string;
}): Promise<OnboardingResult> {
  const name = formData.name.trim();
  const role = ALLOWED_ROLES.includes(formData.role) ? formData.role : "LAY";
  const bio = formData.bio?.trim() || undefined;
  const affiliation = formData.affiliation?.trim() || undefined;

  const authUserId = await getAuthUserId();
  if (!authUserId) {
    redirect("/onboarding");
    return;
  }

  const authEmail = await getAuthUserEmail();
  if (canSkipInviteForOnboarding(authEmail)) {
    try {
      const result = await createAdminProfileForOnboarding(authUserId, { name, bio, affiliation });
      if ("ok" in result && result.ok) redirect("/feed");
      return { error: "error" in result ? result.error : "Unknown error" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      return { error: msg };
    }
  }

  let inviteCode: string;
  if (INVITE_ONLY && !isAdminEmail(authEmail)) {
    inviteCode = (await getInviteCookie()) ?? formData.inviteCode?.trim() ?? "";
    if (!inviteCode) return { error: INVITE_CODE_REQUIRED };
  } else {
    inviteCode = formData.inviteCode?.trim() ?? "";
    if (!inviteCode) return { error: "Invite code is required." };
  }

  const outcome = await validateInviteCode(inviteCode);
  if (outcome !== "VALID") {
    const suffix = inviteCode.length >= 4 ? inviteCode.slice(-4) : "****";
    logInviteFailure(outcome, suffix);
    return { error: OUTCOME_MESSAGES[outcome] };
  }

  try {
    await createUserWithInvite(authUserId, inviteCode, { name, role, bio, affiliation });
    if (INVITE_ONLY) await clearInviteCookie();
    redirect("/feed");
  } catch (e) {
    const suffix = inviteCode.length >= 4 ? inviteCode.slice(-4) : "****";
    logInviteFailure("USED", suffix);
    const msg = e instanceof Error ? e.message : "Something went wrong.";
    if (msg === "That invite code is not valid.") {
      return { error: "This invite has already been used." };
    }
    return { error: msg };
  }
}

/** Dev only: Admin API로 매직 링크 URL 생성. 이메일 발송 한도 없이 테스트용. */
export async function getMagicLinkForDev(
  email: string,
  redirectTo: string
): Promise<{ link: string } | { error: string } | null> {
  if (process.env.NODE_ENV !== "development") return null;
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  try {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: email.trim(),
      options: { redirectTo },
    });
    if (error) return { error: error.message };
    const actionLink = data?.properties?.action_link;
    if (!actionLink) return { error: "No link in response" };
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
    const link = actionLink.startsWith("http") ? actionLink : `${base}/${actionLink.replace(/^\//, "")}`;
    return { link };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to generate link" };
  }
}
