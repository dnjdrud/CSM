import { cookies } from "next/headers";
import { isSameOriginRequest } from "@/server/request-guard";
import { revokeSession } from "@/server/room-access";
import { getSession, SESSION_COOKIE } from "@/server/session";
import { revokeSessionRecord } from "@/server/session-store";

/** Plain HTML form POST -> 303 redirect. Works without JavaScript. */
export async function POST(req: Request) {
  if (!isSameOriginRequest(req)) {
    return new Response("forbidden", { status: 403, headers: { "cache-control": "no-store" } });
  }
  const session = await getSession();
  if (session) {
    revokeSession(session.sid); // end any room entry grant
    revokeSessionRecord(session.sid); // the old cookie stops working even if replayed
  }
  (await cookies()).delete(SESSION_COOKIE);
  const to = session?.role === "son" ? "/admin/login" : "/login";
  return new Response(null, {
    status: 303,
    headers: { location: to, "cache-control": "no-store", "clear-site-data": '"cache"' },
  });
}
