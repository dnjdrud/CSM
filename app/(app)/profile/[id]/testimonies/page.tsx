import { TimelineContainer } from "@/components/TimelineContainer";
import {
  getUserById,
  getCurrentUser,
  listPostsByAuthorId,
  listFollowingIds,
  isBlocked,
  isMuted,
} from "@/lib/data/repository";
import { notFound } from "next/navigation";
import { canViewPost } from "@/lib/domain/guards";
import { ProfileListHeader } from "../_components/ProfileListHeader";
import { ProfileViewAllPosts } from "../_components/ProfileViewAllPosts";

export default async function ProfileTestimoniesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, currentUser, allPosts] = await Promise.all([
    getUserById(id),
    getCurrentUser(),
    listPostsByAuthorId(id),
  ]);

  if (!user) notFound();
  if (!currentUser) notFound();

  const blocked = isBlocked(currentUser.id, id);
  const muted = isMuted(currentUser.id, id);
  const followingIds = await listFollowingIds(currentUser.id);
  const isFollowing = (followerId: string, followingId: string) =>
    followerId === currentUser.id && followingIds.includes(followingId);

  const testimonies = allPosts
    .filter((p) => p.category === "TESTIMONY")
    .filter((p) => !blocked && !muted)
    .filter((p) => canViewPost(p, currentUser, isFollowing));

  return (
    <TimelineContainer>
      <ProfileListHeader
        profileId={id}
        title="Testimonies"
        subtitle="Stories of answered prayer and faithfulness."
      />
      <div className="mt-6">
        <ProfileViewAllPosts
          posts={testimonies}
          profileId={id}
          currentUserId={currentUser.id}
          blocked={blocked}
        />
      </div>
    </TimelineContainer>
  );
}
