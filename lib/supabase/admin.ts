/**
 * Supabase Admin client (service_role). Server-only. Use for generateLink etc.
 * Do not expose SUPABASE_SERVICE_ROLE_KEY to the client.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Returns list of missing env var names (for user-facing error messages). */
export function getMissingAdminEnv(): string[] {
  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return missing;
}

/** Service role client for server-only use (e.g. rate_limits bypassing RLS). Do not use in Client Components. */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export function getSupabaseAdmin() {
  if (!url || !serviceRoleKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[getSupabaseAdmin] Admin client unavailable. Missing env:", getMissingAdminEnv().join(", "));
    }
    return null;
  }
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}
