/**
 * Admin guard: require ADMIN role. Reusable in layout, pages, and server actions.
 * Allows by session.role === ADMIN or by ADMIN_EMAILS allowlist (so middleware + layout stay in sync).
 */
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/admin/bootstrap";
import { supabaseServer } from "@/lib/supabase/server";

export interface AdminContext {
  userId: string;
}

/**
 * Throws no error; redirects to /feed if not authenticated or not ADMIN.
 * Allows when session.role === "ADMIN" or when auth user's email is in ADMIN_EMAILS.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const session = await getSession();
  if (!session) redirect("/feed?message=admin_required");

  if (session.role === "ADMIN") return { userId: session.userId };

  const supabase = await supabaseServer();
  const { data: { session: authSession } } = await supabase.auth.getSession();
  if (authSession?.user?.email && isAdminEmail(authSession.user.email)) return { userId: session.userId };

  redirect("/feed?message=admin_required");
}

/**
 * Returns admin context or null. Use in server actions when you need to return a result instead of redirecting.
 */
export async function getAdminOrNull(): Promise<AdminContext | null> {
  const session = await getSession();
  if (!session) return null;
  if (session.role === "ADMIN") return { userId: session.userId };

  const supabase = await supabaseServer();
  const { data: { session: authSession } } = await supabase.auth.getSession();
  if (authSession?.user?.email && isAdminEmail(authSession.user.email)) return { userId: session.userId };

  return null;
}
