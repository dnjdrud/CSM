import { Suspense } from "react";
import {
  listCommunityPosts,
  getCommunityPost,
} from "@/lib/data/communityRepository";
import { CommunityShell } from "./_components/CommunityShell";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ post?: string }>;
};

export default async function CommunityPage({ searchParams }: Props) {
  const params = await searchParams;
  const postId = params.post?.trim() || null;

  const [{ posts, error: fetchError }, postResult] = await Promise.all([
    listCommunityPosts(),
    postId ? getCommunityPost(postId) : Promise.resolve({ post: null, error: null }),
  ]);

  const selectedPost = postResult.post ?? null;
  const postError = postResult.error ?? null;

  return (
    <div className="w-full flex flex-col min-h-0 flex-1 px-0 md:px-4 py-4 md:py-6">
      <h1 className="sr-only">Community</h1>
      <Suspense
        fallback={
          <div className="p-6 text-theme-muted text-sm">Loading…</div>
        }
      >
        <CommunityShell
          posts={posts}
          selectedPost={selectedPost}
          selectedId={postId}
          fetchError={fetchError}
          postError={postError}
        />
      </Suspense>
    </div>
  );
}
