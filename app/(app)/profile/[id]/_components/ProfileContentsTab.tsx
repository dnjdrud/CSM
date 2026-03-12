import Link from "next/link";
import { ContentCard } from "@/app/(app)/contents/_components/ContentCard";
import type { PostWithAuthor } from "@/lib/domain/types";

type Props = {
  posts: PostWithAuthor[];
  currentUserId: string | null;
  blocked: boolean;
  isOwnProfile: boolean;
};

export function ProfileContentsTab({ posts, currentUserId, blocked, isOwnProfile }: Props) {
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
        <span className="text-4xl" aria-hidden>🎬</span>
        <p className="text-[15px] font-medium text-theme-text">
          {isOwnProfile ? "아직 올린 콘텐츠가 없습니다" : "아직 콘텐츠가 없습니다"}
        </p>
        {isOwnProfile && (
          <Link
            href="/write?category=CONTENT"
            className="inline-block text-[13px] text-theme-primary hover:opacity-80 font-medium"
          >
            콘텐츠 올리기 →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="divide-y divide-theme-border/50">
      {posts.map((post) => (
        <ContentCard key={post.id} post={post} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
