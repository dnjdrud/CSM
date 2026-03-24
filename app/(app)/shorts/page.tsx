import { listFeedPostsPage } from "@/lib/data/repository";
import { getAuthUserId } from "@/lib/auth/session";
import { ShortsFeed } from "./_components/ShortsFeed";

export const dynamic = "force-dynamic";
export const metadata = { title: "숏츠 – Cellah" };

export default async function ShortsPage() {
  // Cookie read (~1ms) — no DB roundtrip needed; only ID is passed downstream.
  const currentUserId = await getAuthUserId();

  const { items } = await listFeedPostsPage({
    currentUserId,
    scope: "ALL",
    limit: 30,
    cursor: null,
    includeCategories: ["SHORTS"],
  });

  // post-videos bucket is public — mediaUrls are already usable public URLs
  const posts = items.filter((p) => (p.mediaUrls?.length ?? 0) > 0);

  return <ShortsFeed posts={posts} currentUserId={currentUserId} />;
}
