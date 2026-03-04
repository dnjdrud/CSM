/**
 * Backend connection: Supabase clients and session.
 * Use in server actions and API routes only.
 */
export { supabaseServer } from "@/lib/supabase/server";
export { getSupabaseAdmin } from "@/lib/supabase/admin";
export { getSession, getAuthUserId } from "@/lib/auth/session";
export { getCurrentUser } from "@/lib/data/repository";
