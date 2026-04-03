import { ProfileShell } from "./_components/ProfileShell";
import { ProfilePostsTab } from "./_components/ProfilePostsTab";
import { ProfileShortsTab } from "./_components/ProfileShortsTab";
import {
  getProfileWithError,
  listPostsByAuthorIdPaged,
  getPostCountByAuthor,
  listFollowingIds,
  getFollowCounts,
} from "@/lib/data/repository";
import { isBlocked, isMuted } from "@/lib/data/repository";
import { getAuthUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, { tab }] = await Promise.all([params, searchParams]);

  const activeTab = tab === "shorts" ? "shorts" : "posts";

  const currentUserId = await getAuthUserId();

  const shouldFetchPosts = activeTab === "posts";
  const shouldFetchShorts = activeTab === "shorts";

  const PROFILE_POST_LIMIT = 30;

  const [
    { user, errorMessage },
    normalPostsResult,
    shortsResult,
    postsCount,
    followCounts,
    viewerFollowingIds,
  ] = await Promise.all([
    getProfileWithError(id),
    // Posts tab: non-SHORTS only, limited — category filter at DB layer
    shouldFetchPosts
      ? listPostsByAuthorIdPaged({ authorId: id, limit: PROFILE_POST_LIMIT, offset: 0, excludeCategory: "SHORTS" })
      : Promise.resolve({ items: [], hasMore: false }),
    // Shorts tab: SHORTS only, limited — category filter at DB layer
    shouldFetchShorts
      ? listPostsByAuthorIdPaged({ authorId: id, limit: PROFILE_POST_LIMIT, offset: 0, category: "SHORTS" })
      : Promise.resolve({ items: [], hasMore: false }),
    // Lightweight COUNT query — only when a post tab is active (matches existing behavior)
    shouldFetchPosts || shouldFetchShorts
      ? getPostCountByAuthor(id, { excludeCategory: "SHORTS" })
      : Promise.resolve(0),
    getFollowCounts(id),
    currentUserId ? listFollowingIds(currentUserId) : Promise.resolve([]),
  ]);

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-theme-danger/20 bg-theme-danger-bg p-6 text-theme-danger">
          <h1 className="text-xl font-semibold">프로필을 불러올 수 없습니다</h1>
          <p className="mt-2 text-sm">
            {errorMessage ?? "존재하지 않는 사용자이거나 오류가 발생했습니다."}
          </p>
        </div>
      </main>
    );
  }

  const blocked = currentUserId ? isBlocked(currentUserId, id) : false;
  const muted = currentUserId ? isMuted(currentUserId, id) : false;
  const following = currentUserId ? viewerFollowingIds.includes(user.id) : false;

  const normalPosts = normalPostsResult.items;

  // post-videos bucket is public — mediaUrls are already usable public URLs
  const shortsPosts = shortsResult.items;

  return (
    <ProfileShell
      user={user}
      currentUserId={currentUserId}
      following={following}
      isMuted={muted}
      isBlocked={blocked}
      postsCount={postsCount}
      followerCount={followCounts.followers}
      followingCount={followCounts.following}
    >
      {activeTab === "posts" && (
        <ProfilePostsTab
          posts={normalPosts}
          currentUserId={currentUserId}
          blocked={blocked}
          isOwnProfile={currentUserId === user.id}
          following={following}
        />
      )}
      {activeTab === "shorts" && (
        <ProfileShortsTab
          posts={shortsPosts}
          currentUserId={currentUserId}
          blocked={blocked}
          isOwnProfile={currentUserId === user.id}
        />
      )}
    </ProfileShell>
  );
}
