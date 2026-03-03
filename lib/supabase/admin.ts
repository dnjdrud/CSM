/**
 * Supabase Admin client (service_role). Server-only. Use for generateLink etc.
 * Do not expose SUPABASE_SERVICE_ROLE_KEY to the client.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseAdmin() {
  if (!url || !serviceRoleKey) {
    if (process.env.NODE_ENV === "development") {
      const missing = [!url && "NEXT_PUBLIC_SUPABASE_URL", !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY"].filter(Boolean);
      console.warn("[getSupabaseAdmin] Admin client unavailable. Missing env:", missing.join(", "));
    }
    return null;
  }
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}
