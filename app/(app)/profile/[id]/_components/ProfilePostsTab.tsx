import Link from "next/link";
import { FeedPostCard } from "@/app/(app)/feed/_components/FeedPostCard";
import type { PostWithAuthor } from "@/lib/domain/types";
import { getServerT } from "@/lib/i18n/server";

type Props = {
  posts: PostWithAuthor[];
  currentUserId: string | null;
  blocked: boolean;
  isOwnProfile: boolean;
  following: boolean;
};

export async function ProfilePostsTab({ posts, currentUserId, blocked, isOwnProfile, following }: Props) {
  const t = await getServerT();

  if (blocked) {
    return (
      <div className="px-4 py-12 text-center text-[14px] text-theme-muted">
        {t.profilePage.blocked}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="px-4 py-16 text-center space-y-3">
        <span className="text-4xl" aria-hidden>📝</span>
        <p className="text-[15px] font-medium text-theme-text">
          {isOwnProfile ? t.profilePage.noOwnPosts : t.profilePage.noPosts}
        </p>
        {isOwnProfile && (
          <Link
            href="/write"
            className="inline-block text-[13px] text-theme-primary hover:opacity-80 font-medium"
          >
            {t.profilePage.writeFirst} →
          </Link>
        )}
      </div>
    );
  }

  return (
    <ul className="list-none p-0" role="list">
      {posts.map((post) => (
        <li key={post.id} className="border-b border-theme-border/50 last:border-b-0">
          <FeedPostCard post={post} currentUserId={currentUserId} initialFollowing={following} />
        </li>
      ))}
    </ul>
  );
}
