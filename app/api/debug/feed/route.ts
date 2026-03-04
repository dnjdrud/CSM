import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listFeedPosts } from "@/lib/data/repository";

/** Dev-only: returns authUserId, count, samplePostIds. Production returns 404. */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }
  const session = await getSession();
  const authUserId = session?.userId ?? null;
  const posts = await listFeedPosts({ scope: "ALL", currentUserId: authUserId });
  const samplePostIds = posts.slice(0, 10).map((p) => p.id);
  return NextResponse.json({
    authUserId,
    count: posts.length,
    samplePostIds,
  });
}
