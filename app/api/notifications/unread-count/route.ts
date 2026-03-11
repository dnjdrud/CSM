import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { countUnreadNotifications as getUnreadNotificationsCount } from "@/lib/data/repository";

/**
 * GET /api/notifications/unread-count
 * Returns { count: number } for the current session user.
 * Used by header polling (every 10s). RLS: notifications SELECT where recipient_id = auth.uid().
 * Uses supabaseServer() so getSession() never throws on refresh_token_already_used.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await supabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return NextResponse.json({ count: 0 });

    const count = await getUnreadNotificationsCount(session.user.id);
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
