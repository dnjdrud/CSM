import { ProfileShell } from "./_components/ProfileShell";
import { RecentPosts } from "./_components/RecentPosts";
import { FeaturedTestimonies } from "./_components/FeaturedTestimonies";
import {
  getProfileWithError,
  getCurrentUser,
  listPostsByAuthorId,
  listFollowerIds,
  listFollowingIds,
} from "@/lib/data/repository";
import { isBlocked, isMuted } from "@/lib/data/repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ user, errorMessage }, currentUser, posts, followerIds, followingIds] =
    await Promise.all([
      getProfileWithError(id),
      getCurrentUser(),
      listPostsByAuthorId(id),
      listFollowerIds(id),
      listFollowingIds(id),
    ]);

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          <h1 className="text-xl font-semibold">Profile unavailable</h1>
          <p className="mt-2 text-sm">
            {errorMessage ?? "User not found or repository error."}
          </p>
        </div>
      </main>
    );
  }

  const currentUserId = currentUser?.id ?? null;
  const blocked = currentUserId ? isBlocked(currentUserId, id) : false;
  const muted = currentUserId ? isMuted(currentUserId, id) : false;

  const viewerFollowingIds = currentUserId
    ? await listFollowingIds(currentUserId)
    : [];
  const following = currentUserId
    ? viewerFollowingIds.includes(user.id)
    : false;

  const testimonyPosts = posts.filter((p) => p.category === "TESTIMONY");
  const normalPosts = posts.filter((p) => p.category !== "TESTIMONY");

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
      <main className="mx-auto w-full max-w-2xl px-4 py-4 space-y-8">
        <section aria-label="Recent posts">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Recent posts</h2>
          <RecentPosts
            posts={normalPosts}
            profileId={user.id}
            currentUserId={currentUserId}
            blocked={blocked}
          />
        </section>
        <section aria-label="Featured testimonies">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            Featured testimonies
          </h2>
          <FeaturedTestimonies
            posts={testimonyPosts}
            profileId={user.id}
            currentUserId={currentUserId}
            blocked={blocked}
          />
        </section>
      </main>
    </ProfileShell>
  );
}
