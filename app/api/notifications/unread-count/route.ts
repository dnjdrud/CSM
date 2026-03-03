import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getUnreadNotificationsCount } from "@/lib/data/notifications";

/**
 * GET /api/notifications/unread-count
 * Returns { count: number } for the current session user.
 * Used by header polling. RLS: notifications SELECT where recipient_id = auth.uid().
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ count: 0 });
    }
    const count = await getUnreadNotificationsCount(session.userId);
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
