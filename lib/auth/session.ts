/**
 * Session via Supabase Auth only. No mock cookie.
 * getSession: auth.getSession() + public.users row (userId, role).
 *
 * IMPORTANT: Uses getSession() (local JWT read) NOT getUser() (network call).
 * getUser() triggers auto-signout on auth errors in writable-cookie contexts
 * (Server Actions, Route Handlers), which clears browser session cookies.
 */
import { cookies } from "next/headers";
import type { UserRole } from "@/lib/domain/types";
import { getUserIdFromCookies } from "@/lib/auth/cookieSession";

export interface Session {
  userId: string;
  role: UserRole;
}

const LOG_PREFIX = "[session]";

/** 쿠키만으로 세션 반환 (SDK 미호출 → 리프레시 소비 없음). */
async function getSessionFromCookieOnly(): Promise<Session | null> {
  const serverUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serverUrl) return null;
  const cookieStore = await cookies();
  const userId = getUserIdFromCookies(cookieStore.getAll(), serverUrl);
  if (!userId) return null;
  const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data: row } = await admin.from("users").select("id, role").eq("id", userId).single();
  if (!row?.role) return null;
  return { userId: row.id, role: row.role as UserRole };
}

/** Read session. 쿠키 우선(리프레시 없음) → 미들웨어와 이중 리프레시 방지. */
export async function getSession(): Promise<Session | null> {
  try {
    const fromCookie = await getSessionFromCookieOnly();
    if (fromCookie) return fromCookie;

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

/** Auth user id only (no profile check). 쿠키 우선으로 SDK 리프레시 방지. */
export async function getAuthUserId(): Promise<string | null> {
  const serverUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (serverUrl) {
    const cookieStore = await cookies();
    const id = getUserIdFromCookies(cookieStore.getAll(), serverUrl);
    if (id) return id;
  }
  try {
    const session = await getSession();
    return session?.userId ?? null;
  } catch {
    return null;
  }
}

/** Auth user email (for admin allowlist). getSession은 쿠키 우선이므로 리프레시 부담 적음. */
export async function getAuthUserEmail(): Promise<string | null> {
  try {
    const session = await getSession();
    if (!session) return null;
    const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
    const admin = getSupabaseAdmin();
    const res = admin ? await admin.from("users").select("email").eq("id", session.userId).single() : { data: null };
    return res.data?.email ?? null;
  } catch {
    return null;
  }
}
