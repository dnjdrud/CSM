"use server";

import { redirect } from "next/navigation";
import { getAuthUserId, getAuthUserEmail } from "@/lib/auth/session";
import { getMissingAdminEnv } from "@/lib/supabase/admin";
import { createSignupRequest } from "@/lib/data/signupRepository";
import { createAdminProfileForOnboarding } from "@/lib/data/signupRepository";
import { canSkipInviteForOnboarding } from "@/lib/admin/bootstrap";
import type { UserRole } from "@/lib/domain/types";

const ALLOWED_ROLES: UserRole[] = ["LAY", "MINISTRY_WORKER", "PASTOR", "MISSIONARY", "SEMINARIAN"];

export type OnboardingResult = { error?: string; redirect?: string } | void;

/** Submit a signup request (approval flow). No Auth user created until admin approves and user completes signup. */
export async function requestSignupAction(formData: {
  email: string;
  name?: string | null;
  role: UserRole;
  church?: string | null;
  bio?: string | null;
  affiliation?: string | null;
  denomination?: string | null;
}): Promise<{ ok: true } | { errorMessage: string }> {
  const missing = getMissingAdminEnv();
  if (missing.length > 0) {
    return {
      errorMessage: `Signup is not configured. Missing env: ${missing.join(", ")}. Contact support.`,
    };
  }
  try {
    const result = await createSignupRequest({
      email: formData.email.trim(),
      name: formData.name?.trim() || null,
      role: ALLOWED_ROLES.includes(formData.role) ? formData.role : "LAY",
      church: formData.church?.trim() || null,
      bio: formData.bio?.trim() || null,
      affiliation: formData.affiliation?.trim() || null,
      denomination: formData.denomination?.trim() || null,
    });
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
      return {
        errorMessage:
          "Signup is not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local and restart.",
      };
    }
    return { errorMessage: msg };
  }
}

/** Complete profile for bypass admin (e.g. ADMIN_EMAILS). Only when already logged in and bypass email. */
export async function submitOnboarding(formData: {
  name: string;
  role?: UserRole;
  bio?: string;
  affiliation?: string;
}): Promise<OnboardingResult> {
  const authUserId = await getAuthUserId();
  if (!authUserId) {
    redirect("/onboarding");
    return;
  }
  const authEmail = await getAuthUserEmail();
  if (!canSkipInviteForOnboarding(authEmail)) {
    return { error: "Use the approval link from your email to complete signup." };
  }
  try {
    const result = await createAdminProfileForOnboarding(authUserId, {
      name: formData.name?.trim() || "Admin",
      bio: formData.bio?.trim(),
      affiliation: formData.affiliation?.trim(),
    });
    if ("ok" in result && result.ok) redirect("/feed");
    return { error: "error" in result ? result.error : "Unknown error" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Something went wrong.";
    return { error: msg };
  }
}

/** Dev only: generate magic link URL for testing (no email sent). */
export async function getMagicLinkForDev(
  email: string,
  redirectTo: string
): Promise<{ link: string } | { error: string } | null> {
  if (process.env.NODE_ENV !== "development") return null;
  const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
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
