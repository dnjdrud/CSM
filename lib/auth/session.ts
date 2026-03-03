/**
 * Session via Supabase Auth only. No mock cookie.
 * getSession: auth.getUser() + public.users row (userId, role).
 */
import type { UserRole } from "@/lib/domain/types";

export interface Session {
  userId: string;
  role: UserRole;
}

/** Read session from Supabase auth + public.users row. Returns null if not logged in or no profile. */
export async function getSession(): Promise<Session | null> {
  try {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return null;
    const { ensureAdminRoleIfAllowed } = await import("@/lib/admin/bootstrap");
    await ensureAdminRoleIfAllowed();
    const { ensureProfileForBypassEmail } = await import("@/lib/data/userProvisioning");
    await ensureProfileForBypassEmail({ userId: user.id, email: user.email });
    const { data: row } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", user.id)
      .single();
    if (!row || !row.role) return null;
    return { userId: row.id, role: row.role as UserRole };
  } catch {
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
