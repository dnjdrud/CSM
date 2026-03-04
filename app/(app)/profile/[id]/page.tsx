import Link from "next/link";
import { notFound } from "next/navigation";
import { TimelineContainer } from "@/components/TimelineContainer";
import {
  getUserById,
  getCurrentUser,
  listPostsByAuthorId,
  listFollowingIds,
  isBlocked,
  isMuted,
} from "@/lib/data/repository";
import { canViewPost } from "@/lib/domain/guards";
import { ProfileHero } from "./_components/ProfileHero";
import { ProfileTabs } from "./_components/ProfileTabs";
import { RecentPosts } from "./_components/RecentPosts";

export const dynamic = "force-dynamic";

type ProfileTab = "posts" | "notes" | "testimonies";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activeTab: ProfileTab = "posts";

  const [user, currentUser, allPosts] = await Promise.all([
    getUserById(id),
    getCurrentUser(),
    listPostsByAuthorId(id),
  ]);

  if (!user) notFound();
  if (!currentUser) notFound();

  const followingIds = await listFollowingIds(currentUser.id);

  const blocked = isBlocked(currentUser.id, id);
  const muted = isMuted(currentUser.id, id);
  const isOwnProfile = currentUser.id === id;
  const following = followingIds.includes(id);
  const isFollowing = (followerId: string, followingId: string) =>
    followerId === currentUser.id && followingIds.includes(followingId);

  const posts = allPosts
    .filter((p) => p.category !== "TESTIMONY")
    .filter(() => !blocked && !muted)
    .filter((p) => canViewPost(p, currentUser, isFollowing));

  return (
    <TimelineContainer>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="pb-4">
          <Link
            href="/feed"
            className="text-[14px] text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
          >
            ← Back to feed
          </Link>
        </div>

        <ProfileHero
          user={user}
          isOwnProfile={isOwnProfile}
          following={following}
          isMuted={muted}
          isBlocked={blocked}
          currentUserId={currentUser.id}
        />

        <ProfileTabs profileId={id} activeTab={activeTab} />

        <div className="mt-6">
          <RecentPosts
            posts={posts}
            profileId={id}
            currentUserId={currentUser.id}
            blocked={blocked}
          />
        </div>
      </div>
    </TimelineContainer>
  );
}
