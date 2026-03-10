import { getAuthUserId } from "@/lib/auth/session";
import { BottomNav } from "./BottomNav";

export async function BottomNavWrapper() {
  const userId = await getAuthUserId();
  return <BottomNav profileHref={userId ? `/profile/${userId}` : "/me"} />;
}
