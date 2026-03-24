import Link from "next/link";
import { getPostById, getCurrentUser, listCommentsByPostId, listFollowingIds } from "@/lib/data/repository";
import { getAuthUserId } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import { canViewPost } from "@/lib/domain/guards";
import { TimelineContainer } from "@/components/TimelineContainer";
import { PostDetailHeader } from "./_components/PostDetailHeader";
import { PostDetailBody } from "./_components/PostDetailBody";
import { PostDetailReactions } from "./_components/PostDetailReactions";
import { CommentsSection } from "./_components/CommentsSection";
import { recordUserInteraction } from "@/lib/data/supabaseRepository";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // getAuthUserId reads the JWT cookie (~1ms) so listFollowingIds can start
  // in parallel with getPostById and getCurrentUser() instead of waiting for
  // the getCurrentUser() DB roundtrip to complete first.
  const currentUserId = await getAuthUserId();

  const [post, currentUser, followingIds] = await Promise.all([
    getPostById(id),
    getCurrentUser(),
    currentUserId ? listFollowingIds(currentUserId) : Promise.resolve([]),
  ]);

  if (!post) notFound();

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

  const [comments] = await Promise.all([
    listCommentsByPostId(id),
    currentUser ? recordUserInteraction(currentUser.id, id, "view").catch(() => {}) : Promise.resolve(),
  ]);

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

        <PostDetailReactions post={post} currentUserId={currentUser?.id ?? null} />

        <CommentsSection
          postId={post.id}
          currentUserId={currentUser?.id ?? null}
          comments={comments}
          allowComments={true}
        />
      </article>
    </TimelineContainer>
  );
}
