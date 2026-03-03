/**
 * Server-side user provisioning for onboarding bypass.
 * Idempotent: if public.users row exists, no-op.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin/bootstrap";
import { isOnboardingBypassEmail } from "@/lib/auth/bypass";

async function getApprovalInviteCodeId(admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>): Promise<string | null> {
  const { data } = await admin.from("invite_codes").select("id").eq("code", "APPROVAL").maybeSingle();
  return data?.id ?? null;
}

/**
 * If the authenticated user's email is in the bypass allowlist and they have no public.users row,
 * insert one (idempotent). Role = ADMIN if in ADMIN_EMAILS, else LAY.
 * Does not throw; logs and returns on failure.
 */
export async function ensureProfileForBypassEmail(params: {
  userId: string;
  email: string | null | undefined;
}): Promise<void> {
  const { userId, email } = params;
  if (!email || !isOnboardingBypassEmail(email)) return;

  const admin = getSupabaseAdmin();
  if (!admin) {
    console.warn("[userProvisioning] ensureProfileForBypassEmail: SUPABASE_SERVICE_ROLE_KEY not set; cannot create public.users row. Set it in .env.local so bypass login works.");
    return;
  }

  try {
    const { data: existing } = await admin.from("users").select("id").eq("id", userId).maybeSingle();
    if (existing) return;

    const name = email.includes("@") ? email.split("@")[0] || "Admin" : "Admin";
    const role = isAdminEmail(email) ? "ADMIN" : "LAY";

    // Admin/bypass: only id, name, role required for login; all other profile fields null
    const row: Record<string, unknown> = {
      id: userId,
      name,
      role,
      bio: null,
      affiliation: null,
      username: null,
      church: null,
    };

    const inviteCodeId = await getApprovalInviteCodeId(admin);
    if (inviteCodeId) row.invite_code_id = inviteCodeId;

    let result = await admin.from("users").upsert(row, {
      onConflict: "id",
      ignoreDuplicates: false,
    });

    if (result.error) {
      const msg = result.error.message || "";
      if (msg.includes("invite_code_id") || msg.includes("column")) {
        delete row.invite_code_id;
        delete row.username;
        delete row.church;
        result = await admin.from("users").upsert(row, {
          onConflict: "id",
          ignoreDuplicates: false,
        });
      }
    }

    // Final fallback: minimal row (id, name, role only) so session never fails for bypass users
    if (result.error) {
      const minimal: Record<string, unknown> = { id: userId, name, role };
      const minimalResult = await admin.from("users").upsert(minimal, {
        onConflict: "id",
        ignoreDuplicates: false,
      });
      if (!minimalResult.error) result = minimalResult;
    }

    if (result.error) {
      console.warn("[userProvisioning] ensureProfileForBypassEmail failed:", result.error.message);
    }
  } catch (e) {
    console.warn("[userProvisioning] ensureProfileForBypassEmail error:", e);
  }
}
