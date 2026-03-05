/**
 * Session via Supabase Auth only. No mock cookie.
 * getSession: auth.getUser() + public.users row (userId, role).
 */
import type { UserRole } from "@/lib/domain/types";

export interface Session {
  userId: string;
  role: UserRole;
}

const LOG_PREFIX = "[session]";

/** Read session from Supabase auth + public.users row. Returns null if not logged in or no profile. */
export async function getSession(): Promise<Session | null> {
  try {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.warn(LOG_PREFIX, "getSession null: auth.getUser error:", authError.message);
      return null;
    }
    if (!user?.id) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(LOG_PREFIX, "getSession null: no auth user (cookies missing or wrong domain)");
      }
      return null;
    }
    const { ensureAdminRoleIfAllowed } = await import("@/lib/admin/bootstrap");
    await ensureAdminRoleIfAllowed();
    const profileResult = await supabase.from("users").select("id, role").eq("id", user.id).single();
    let row: { id: string; role: string } | null = profileResult.data;
    if (!row || !row.role) {
      const { ensureProfile } = await import("@/lib/auth/ensureProfile");
      const ensured = await ensureProfile({ userId: user.id, email: user.email });
      if (ensured.created) {
        const refetch = await supabase.from("users").select("id, role").eq("id", user.id).single();
        row = refetch.data;
      }
      if (ensured.error) {
        console.warn(LOG_PREFIX, "getSession: ensureProfile failed:", ensured.error);
      }
    }
    if (!row || !row.role) {
      console.warn(LOG_PREFIX, "getSession null: no profile row for user.id=" + user.id);
      return null;
    }
    return { userId: row.id, role: row.role as UserRole };
  } catch (e) {
    console.warn(LOG_PREFIX, "getSession threw:", e instanceof Error ? e.message : String(e));
    return null;
  }
}

/** No-op. Session is set by Supabase on sign-in. */
export async function setSession(_session: Session): Promise<void> {}

/** Sign out from Supabase. */
export async function clearSession(): Promise<void> {
  try {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const supabase = await supabaseServer();
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
}

/** Auth user id only (no profile check). */
export async function getAuthUserId(): Promise<string | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
    const { supabaseServer } = await import("@/lib/supabase/server");
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

/** Auth user email (for admin allowlist check). */
export async function getAuthUserEmail(): Promise<string | null> {
  try {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email ?? null;
  } catch {
    return null;
  }
}
