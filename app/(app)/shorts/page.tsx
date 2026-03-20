import { listFeedPostsPage } from "@/lib/data/repository";
import { ShortsFeed } from "./_components/ShortsFeed";

export const dynamic = "force-dynamic";
export const metadata = { title: "숏츠 – Cellah" };

export default async function ShortsPage() {
  const { items } = await listFeedPostsPage({
    currentUserId: null,
    scope: "ALL",
    limit: 30,
    cursor: null,
    includeCategories: ["SHORTS"],
  });

  // Only posts that have an uploaded video
  const posts = items.filter((p) => (p.mediaUrls?.length ?? 0) > 0);

  return <ShortsFeed posts={posts} />;
}
