import { getSession } from "@/lib/auth/session";
import { getUserById, countUnreadNotifications } from "@/lib/data/repository";
import { Header } from "./Header";

/** Fetches session + current user and passes to Header. Catches so layout never 500s. */
export async function HeaderWrapper() {
  let user: { id: string; name: string; isAdmin: boolean; role?: string } | null = null;
  let unreadCount = 0;
  try {
    const session = await getSession();
    if (process.env.NODE_ENV !== "production") {
      console.log("[HeaderWrapper] getSession():", session ? { userId: session.userId, role: session.role } : null);
    }
    if (session) {
      const u = await getUserById(session.userId);
      if (u) {
        user = { id: u.id, name: u.name, isAdmin: session.role === "ADMIN", role: session.role };
        unreadCount = await countUnreadNotifications(u.id);
      } else {
        user = { id: session.userId, name: "", isAdmin: session.role === "ADMIN", role: session.role };
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[HeaderWrapper]", err);
    }
  }
  return <Header user={user} initialUnreadCount={unreadCount} />;
}
