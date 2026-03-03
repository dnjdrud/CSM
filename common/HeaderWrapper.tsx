import { getSession } from "@/lib/auth/session";
import { getUserById } from "@/lib/data/repository";
import { countUnreadNotifications } from "@/lib/data/notifications";
import { Header } from "./Header";

/** Fetches session + current user and passes to Header. Catches so / never 500s. */
export async function HeaderWrapper() {
  let user: { id: string; name: string; isAdmin: boolean } | null = null;
  let unreadCount = 0;
  try {
    const session = await getSession();
    if (session) {
      const u = await getUserById(session.userId);
      if (u) {
        const isAdmin = session.role === "ADMIN";
        user = { id: u.id, name: u.name, isAdmin };
        unreadCount = await countUnreadNotifications(u.id);
      }
    }
  } catch {
    // ignore
  }
  return <Header user={user} initialUnreadCount={unreadCount} />;
}
