/**
 * Ensure public.users row exists for an auth user. Idempotent.
 * Called when auth user exists but profile row is missing (e.g. first login, or non-bypass user).
 * Creates minimal row: id, name, role (ADMIN if in ADMIN_EMAILS else LAY), created_at.
 * Does NOT log tokens or cookies; safe for server-side only.
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin/bootstrap";

export interface EnsureProfileParams {
  userId: string;
  email: string | null | undefined;
}

/**
 * If public.users has no row for userId, create one. Role = ADMIN if email in ADMIN_EMAILS, else LAY.
 * Uses service role so RLS does not block. Safe to call repeatedly.
 */
export async function ensureProfile(params: EnsureProfileParams): Promise<{ created: boolean; error?: string }> {
  const { userId, email } = params;
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { created: false, error: "SUPABASE_SERVICE_ROLE_KEY not set" };
  }

  try {
    const { data: existing } = await admin.from("users").select("id").eq("id", userId).maybeSingle();
    if (existing) return { created: false };

    const name = email && email.includes("@") ? email.split("@")[0]!.trim() || "New member" : "New member";
    const role = email && isAdminEmail(email) ? "ADMIN" : "LAY";
    const row: Record<string, unknown> = {
      id: userId,
      name,
      role,
    };

    const result = await admin.from("users").upsert(row, {
      onConflict: "id",
      ignoreDuplicates: false,
    });

    if (result.error) {
      const msg = result.error.message ?? "";
      if (msg.includes("column") || msg.includes("invite_code_id") || msg.includes("username") || msg.includes("church")) {
        const minimal = { id: userId, name, role };
        const minimalResult = await admin.from("users").upsert(minimal, {
          onConflict: "id",
          ignoreDuplicates: false,
        });
        if (!minimalResult.error) return { created: true };
        return { created: false, error: minimalResult.error.message };
      }
      return { created: false, error: msg };
    }
    return { created: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { created: false, error: message };
  }
}
