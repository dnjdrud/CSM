import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import type { PostWithAuthor } from "@/lib/domain/types";

type Props = {
  posts: PostWithAuthor[];
  currentUserId: string | null;
  blocked: boolean;
  isOwnProfile: boolean;
};

export function ProfilePostsTab({ posts, currentUserId, blocked, isOwnProfile }: Props) {
  if (blocked) {
    return (
      <div className="px-4 py-12 text-center text-[14px] text-theme-muted">
        이 사용자를 차단했습니다.
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="px-4 py-16 text-center space-y-3">
        <span className="text-4xl" aria-hidden>📝</span>
        <p className="text-[15px] font-medium text-theme-text">
          {isOwnProfile ? "아직 작성한 글이 없습니다" : "아직 게시글이 없습니다"}
        </p>
        {isOwnProfile && (
          <Link
            href="/write"
            className="inline-block text-[13px] text-theme-primary hover:opacity-80 font-medium"
          >
            첫 글 작성하기 →
          </Link>
        )}
      </div>
    );
  }

  return (
    <ul className="list-none p-0" role="list">
      {posts.map((post) => (
        <li key={post.id} className="border-b border-theme-border/50 last:border-b-0">
          <PostCard post={post} currentUserId={currentUserId} />
        </li>
      ))}
    </ul>
  );
}
