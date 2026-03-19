import { TimelineContainer } from "@/components/TimelineContainer";
import {
  getUserById,
  getCurrentUser,
  listPostsByAuthorIdPaged,
  listFollowingIds,
  isBlocked,
  isMuted,
} from "@/lib/data/repository";
import { notFound } from "next/navigation";
import { canViewPost } from "@/lib/domain/guards";
import { ProfileListHeader } from "../_components/ProfileListHeader";
import { ProfileViewAllPosts } from "../_components/ProfileViewAllPosts";
import { loadMoreProfilePostsAction } from "../actions";

const INITIAL_LIMIT = 20;

export default async function ProfilePostsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, currentUser] = await Promise.all([
    getUserById(id),
    getCurrentUser(),
  ]);

  if (!user) notFound();
  if (!currentUser) notFound();

  const blocked = isBlocked(currentUser.id, id);
  const muted = isMuted(currentUser.id, id);
  const followingIds = await listFollowingIds(currentUser.id);
  const isFollowing = (followerId: string, followingId: string) =>
    followerId === currentUser.id && followingIds.includes(followingId);

  const { items: allItems, hasMore: rawHasMore } = await listPostsByAuthorIdPaged({
    authorId: id,
    limit: INITIAL_LIMIT * 2, // 필터로 제거될 수 있어 여유있게 요청
    offset: 0,
  });

  const posts = allItems
    .filter((p) => !blocked && !muted)
    .filter((p) => canViewPost(p, currentUser, isFollowing))
    .slice(0, INITIAL_LIMIT);

  const initialHasMore = rawHasMore || allItems.length > posts.length;

  return (
    <TimelineContainer>
      <ProfileListHeader
        profileId={id}
        title="포스트"
        subtitle="이 분의 최근 포스트입니다."
      />
      <div className="mt-6">
        <ProfileViewAllPosts
          posts={posts}
          profileId={id}
          currentUserId={currentUser.id}
          blocked={blocked}
          initialHasMore={initialHasMore}
          loadMoreAction={loadMoreProfilePostsAction}
        />
      </div>
    </TimelineContainer>
  );
}
