import Link from "next/link";
import { getPostById, getCurrentUser, listCommentsByPostId, listFollowingIds, isBlocked, isMuted } from "@/lib/data/repository";
import { notFound } from "next/navigation";
import { canViewPost } from "@/lib/domain/guards";
import { TimelineContainer } from "@/components/TimelineContainer";
import { PostDetailHeader } from "./_components/PostDetailHeader";
import { PostDetailBody } from "./_components/PostDetailBody";
import { PostDetailReactions } from "./_components/PostDetailReactions";
import { CommentsSection } from "./_components/CommentsSection";

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

  const isFollowingSnap = currentUser
    ? await listFollowingIds(currentUser.id).then(
        (ids) => (followerId: string, followingId: string) =>
          followerId === currentUser.id && ids.includes(followingId)
      )
    : () => false;
  const canView = currentUser && canViewPost(post, currentUser, isFollowingSnap);

  if (!canView) {
    return (
      <TimelineContainer>
        <div className="px-4 py-10 text-center">
          <Link
            href="/feed"
            className="text-[15px] text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded inline-block mb-6"
          >
            ← Back to feed
          </Link>
          <p className="text-gray-500 font-sans">This post is not available.</p>
        </div>
      </TimelineContainer>
    );
  }

  const allComments = await listCommentsByPostId(id);
  const comments = currentUser
    ? allComments.filter(
        (c) =>
          !isBlocked(currentUser.id, c.authorId) && !isMuted(currentUser.id, c.authorId)
      )
    : allComments;

  return (
    <TimelineContainer>
      <article className="px-4">
        <Link
          href="/feed"
          className="text-[15px] text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded inline-block py-4"
        >
          ← Back to feed
        </Link>

        <PostDetailHeader post={post} currentUser={currentUser} />

        <PostDetailBody post={post} />

        <PostDetailReactions post={post} currentUserId={currentUser?.id ?? null} />

        <CommentsSection
          postId={post.id}
          currentUserId={currentUser?.id ?? null}
          comments={comments}
        />
      </article>
    </TimelineContainer>
  );
}
