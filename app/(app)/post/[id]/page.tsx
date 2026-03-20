import Link from "next/link";
import { getPostById, getCurrentUser, listCommentsByPostId, listFollowingIds, isBlocked, isMuted } from "@/lib/data/repository";
import { notFound } from "next/navigation";
import { canViewPost } from "@/lib/domain/guards";
import { TimelineContainer } from "@/components/TimelineContainer";
import { PostDetailHeader } from "./_components/PostDetailHeader";
import { PostDetailBody } from "./_components/PostDetailBody";
import { PostDetailReactions } from "./_components/PostDetailReactions";
import { CommentsSection } from "./_components/CommentsSection";
import { ClipRecommendationsSection } from "./_components/ClipRecommendationsSection";
import { getClipRecommendations, recordUserInteraction } from "@/lib/data/supabaseRepository";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, currentUser] = await Promise.all([
    getPostById(id),
    getCurrentUser(),
  ]);

  if (!post) notFound();

  const followingIds = currentUser ? await listFollowingIds(currentUser.id) : [];
  const isFollowingSnap = (followerId: string, followingId: string) =>
    currentUser != null && followerId === currentUser.id && followingIds.includes(followingId);
  const canView = currentUser && canViewPost(post, currentUser, isFollowingSnap);
  const authorFollowing = currentUser != null && followingIds.includes(post.authorId);

  if (!canView) {
    return (
      <TimelineContainer>
        <div className="px-4 py-10 text-center">
          <Link
            href="/home"
            className="text-[15px] text-theme-muted hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 rounded inline-block mb-6"
          >
            ← 홈으로
          </Link>
          <p className="text-theme-muted font-sans">이 게시글을 볼 수 없습니다.</p>
        </div>
      </TimelineContainer>
    );
  }

  const allowComments = true;

  const [allComments, initialClips] = await Promise.all([
    allowComments ? listCommentsByPostId(id) : Promise.resolve([]),
    post.youtubeUrl ? getClipRecommendations(id) : Promise.resolve([]),
    currentUser ? recordUserInteraction(currentUser.id, id, "view").catch(() => {}) : Promise.resolve(),
  ]);
  const comments = allowComments && currentUser
    ? allComments.filter(
        (c) =>
          !isBlocked(currentUser.id, c.authorId) && !isMuted(currentUser.id, c.authorId)
      )
    : allComments;

  const isAuthor = currentUser?.id === post.authorId;

  return (
    <TimelineContainer>
      <article className="px-4">
        <Link
          href="/home"
          className="text-[15px] text-theme-muted hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 rounded inline-block py-4"
        >
          ← 홈으로
        </Link>

        <PostDetailHeader post={post} currentUser={currentUser} authorFollowing={authorFollowing} />

        <PostDetailBody post={post} />

        {post.youtubeUrl && isAuthor && (
          <ClipRecommendationsSection
            postId={post.id}
            initialClips={initialClips}
          />
        )}

        <PostDetailReactions post={post} currentUserId={currentUser?.id ?? null} />

        <CommentsSection
          postId={post.id}
          currentUserId={currentUser?.id ?? null}
          comments={comments}
          allowComments={allowComments}
        />
      </article>
    </TimelineContainer>
  );
}
