/**
 * Session via Supabase Auth only. No mock cookie.
 * getSession: auth.getSession() + public.users row (userId, role).
 *
 * IMPORTANT: Uses getSession() (local JWT read) NOT getUser() (network call).
 * getUser() triggers auto-signout on auth errors in writable-cookie contexts
 * (Server Actions, Route Handlers), which clears browser session cookies.
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
    const { data: { session: authSession }, error: authError } = await supabase.auth.getSession();
    const user = authSession?.user ?? null;
    if (authError) {
      const isStaleRefresh = (authError as { code?: string }).code === "refresh_token_already_used";
      if (!isStaleRefresh) {
        console.warn(LOG_PREFIX, "getSession null: auth.getSession error:", authError.message);
      }
      return null;
    }
    if (!user?.id) {
      return null;
    }
    const { ensureAdminRoleIfAllowed } = await import("@/lib/admin/bootstrap");
    await ensureAdminRoleIfAllowed();
    const { ensureProfile } = await import("@/lib/auth/ensureProfile");
    // Ensure profile row exists (idempotent). Uses admin client internally.
    await ensureProfile({ userId: user.id, email: user.email });
    // Use admin client to bypass RLS — prevents false null returns when anon query is blocked.
    const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
    const admin = getSupabaseAdmin();
    const queryClient = admin ?? supabase;
    const profileResult = await queryClient.from("users").select("id, role").eq("id", user.id).single();
    const row: { id: string; role: string } | null = profileResult.data;
    if (!row || !row.role) {
      console.warn(LOG_PREFIX, "getSession null: no profile or role (auth user.id=" + user.id + ", error=" + (profileResult.error?.message ?? "none") + ")");
      return null;
    }
    return { userId: row.id, role: row.role as UserRole };
  } catch (e) {
    const isStaleRefresh =
      (e as { code?: string })?.code === "refresh_token_already_used" ||
      (e instanceof Error && e.message.includes("Already Used"));
    if (!isStaleRefresh) {
      console.warn(LOG_PREFIX, "getSession threw:", e instanceof Error ? e.message : String(e));
    }
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

/** Auth user id only (no profile check). For onboarding: show profile form when auth exists but no profile. */
export async function getAuthUserId(): Promise<string | null> {
  try {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const supabase = await supabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Auth user email (for admin allowlist check). */
export async function getAuthUserEmail(): Promise<string | null> {
  try {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const supabase = await supabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.email ?? null;
  } catch {
    return null;
  }
}
