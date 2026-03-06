import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUnreadNotificationsCount } from "@/lib/data/notifications";

/**
 * GET /api/notifications/unread-count
 * Returns { count: number } for the current session user.
 * Used by header polling (every 10s). RLS: notifications SELECT where recipient_id = auth.uid().
 *
 * IMPORTANT: Uses supabase.auth.getSession() (local JWT read), NOT getSession() from
 * lib/auth/session which calls getUser() (network call). In a writable-cookie route handler,
 * getUser() auth errors trigger signOut() → removeSession() → setAll([cleared cookies]),
 * which would clear the browser session cookies and break subsequent navigation.
 * setAll is intentionally a no-op here to prevent any accidental cookie writes.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return NextResponse.json({ count: 0 });

    const cookieStore = await cookies();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Intentional no-op: never write cookies in this background polling route.
          // A network auth error here must NOT clear the browser's session cookies.
        },
      },
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return NextResponse.json({ count: 0 });

    const count = await getUnreadNotificationsCount(session.user.id);
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
