import { ProfileShell } from "./_components/ProfileShell";
import { ProfilePostsTab } from "./_components/ProfilePostsTab";
import { ProfileContentsTab } from "./_components/ProfileContentsTab";
import { ProfileCrowTab } from "./_components/ProfileCrowTab";
import { ProfileSpiritualTab } from "./_components/ProfileSpiritualTab";
import {
  getProfileWithError,
  getCurrentUser,
  listPostsByAuthorId,
  listFollowerIds,
  listFollowingIds,
} from "@/lib/data/repository";
import { isBlocked, isMuted } from "@/lib/data/repository";
import { getAuthUserId } from "@/lib/auth/session";
import type { PostCategory } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

const CONTENT_CATEGORIES: PostCategory[] = ["CONTENT", "PHOTO"];

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, { tab }] = await Promise.all([params, searchParams]);
  const activeTab = (tab === "contents" || tab === "crow" || tab === "spiritual")
    ? tab
    : "posts";

  const currentUserId = await getAuthUserId();

  const [
    { user, errorMessage },
    currentUser,
    posts,
    followerIds,
    followingIds,
    viewerFollowingIds,
  ] = await Promise.all([
    getProfileWithError(id),
    currentUserId ? getCurrentUser() : Promise.resolve(null),
    listPostsByAuthorId(id),
    listFollowerIds(id),
    listFollowingIds(id),
    currentUserId ? listFollowingIds(currentUserId) : Promise.resolve([]),
  ]);

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
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

  // 탭별 게시글 분류
  const contentPosts = posts.filter((p) =>
    CONTENT_CATEGORIES.includes(p.category as PostCategory)
  );
  const normalPosts = posts.filter(
    (p) => !CONTENT_CATEGORIES.includes(p.category as PostCategory)
  );

  return (
    <ProfileShell
      user={user}
      currentUserId={currentUserId}
      following={following}
      isMuted={muted}
      isBlocked={blocked}
      postsCount={normalPosts.length}
      followerCount={followerIds.length}
      followingCount={followingIds.length}
    >
      {activeTab === "posts" && (
        <ProfilePostsTab
          posts={normalPosts}
          currentUserId={currentUserId}
          blocked={blocked}
          isOwnProfile={currentUserId === user.id}
        />
      )}
      {activeTab === "contents" && (
        <ProfileContentsTab
          posts={contentPosts}
          currentUserId={currentUserId}
          blocked={blocked}
          isOwnProfile={currentUserId === user.id}
        />
      )}
      {activeTab === "crow" && (
        <ProfileCrowTab
          profileId={user.id}
          currentUserId={currentUserId}
        />
      )}
      {activeTab === "spiritual" && (
        <ProfileSpiritualTab
          profileId={user.id}
          isOwnProfile={currentUserId === user.id}
        />
      )}
    </ProfileShell>
  );
}
