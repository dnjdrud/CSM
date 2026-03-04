import Link from "next/link";
import { ROLE_DISPLAY } from "@/lib/domain/types";
import { ReportMenu } from "@/components/ReportMenu";
import { FollowButton } from "@/components/FollowButton";
import { PostActionsMenu } from "./PostActionsMenu";
import { formatDate } from "../_lib/format";
import type { PostWithAuthor } from "@/lib/domain/types";
import type { User } from "@/lib/domain/types";

type Props = {
  post: PostWithAuthor;
  currentUser: User | null;
  /** Whether current user follows the post author (for Follow button). */
  authorFollowing?: boolean;
};

export function PostDetailHeader({ post, currentUser, authorFollowing = false }: Props) {
  const isAuthor = currentUser && post.authorId === currentUser.id;

  return (
    <header className="py-4 border-b border-gray-200 flex items-start justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
          <Link
            href={`/profile/${post.author.id}`}
            className="text-base font-medium text-gray-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
          >
            {post.author.name}
          </Link>
          <span className="text-gray-400">·</span>
          <span className="text-[13px] text-neutral-500">{ROLE_DISPLAY[post.author.role]}</span>
          <span className="text-gray-400">·</span>
          <time dateTime={post.createdAt} className="text-xs text-neutral-500">
            {formatDate(post.createdAt)}
          </time>
        </div>
        {post.author.affiliation && (
          <p className="mt-0.5 text-xs text-neutral-500">{post.author.affiliation}</p>
        )}
      </div>
      {currentUser && (
        <div className="flex shrink-0 items-center gap-2">
          {isAuthor && <PostActionsMenu post={post} />}
          {!isAuthor && (
            <FollowButton
              followingId={post.authorId}
              initialFollowing={authorFollowing}
            />
          )}
          <ReportMenu targetType="post" postId={post.id} onReported={() => {}} />
        </div>
      )}
    </header>
  );
}
