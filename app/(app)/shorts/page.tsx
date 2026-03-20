import { getCurrentUser, listFeedPostsPage } from "@/lib/data/repository";
import { getVideoSignedReadUrlAction } from "@/app/(app)/write/getUploadUrlAction";
import { ShortsFeed } from "./_components/ShortsFeed";

export const dynamic = "force-dynamic";
export const metadata = { title: "숏츠 – Cellah" };

export default async function ShortsPage() {
  const currentUser = await getCurrentUser();

  const { items } = await listFeedPostsPage({
    currentUserId: currentUser?.id ?? null,
    scope: "ALL",
    limit: 30,
    cursor: null,
    includeCategories: ["SHORTS"],
  });

  const withMedia = items.filter((p) => (p.mediaUrls?.length ?? 0) > 0);

  // Generate signed read URLs so videos play even if bucket is private
  const posts = await Promise.all(
    withMedia.map(async (p) => {
      const signedUrls = await Promise.all(
        (p.mediaUrls ?? []).map((url) => getVideoSignedReadUrlAction(url)),
      );
      const resolved = signedUrls.map((s, i) => s ?? p.mediaUrls![i]);
      return { ...p, mediaUrls: resolved };
    }),
  );

  return <ShortsFeed posts={posts} currentUserId={currentUser?.id ?? null} />;
}
