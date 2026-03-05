"use server";

import { getMissingAdminEnv } from "@/lib/supabase/admin";
import { createSignupRequest } from "@/lib/data/signupRepository";
import type { UserRole } from "@/lib/domain/types";

const ALLOWED_ROLES: UserRole[] = ["LAY", "MINISTRY_WORKER", "PASTOR", "MISSIONARY", "SEMINARIAN"];

/** Submit a signup request (approval flow). No Auth user created until admin approves and user completes signup. */
export async function requestSignupAction(formData: {
  email: string;
  name?: string | null;
  role: UserRole;
  church?: string | null;
  bio?: string | null;
  affiliation?: string | null;
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
