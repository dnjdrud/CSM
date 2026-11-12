import { cookies } from "next/headers";
import { isSameOriginRequest } from "@/server/request-guard";
import { getSession, introCookieName, introCookieOptions } from "@/server/session";

/** Marks the first-visit intro as finished for this parent on this browser, then opens the room list. */
export async function POST(req: Request) {
  const noStore = { "cache-control": "no-store" };
  if (!isSameOriginRequest(req)) return new Response("forbidden", { status: 403, headers: noStore });

  const session = await getSession();
  if (!session) return new Response(null, { status: 303, headers: { location: "/login", ...noStore } });
  if (session.role === "son") return new Response(null, { status: 303, headers: { location: "/admin", ...noStore } });

  (await cookies()).set(introCookieName(session.role), "1", introCookieOptions());
  return new Response(null, { status: 303, headers: { location: "/rooms", ...noStore } });
}
