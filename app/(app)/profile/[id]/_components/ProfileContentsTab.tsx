import Link from "next/link";
import { ContentCard } from "@/app/(app)/contents/_components/ContentCard";
import type { PostWithAuthor } from "@/lib/domain/types";
import { getServerT } from "@/lib/i18n/server";

type Props = {
  posts: PostWithAuthor[];
  currentUserId: string | null;
  blocked: boolean;
  isOwnProfile: boolean;
};

export async function ProfileContentsTab({ posts, currentUserId, blocked, isOwnProfile }: Props) {
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
        <span className="text-4xl" aria-hidden>🎬</span>
        <p className="text-[15px] font-medium text-theme-text">
          {isOwnProfile ? t.profilePage.noOwnContents : t.profilePage.noContents}
        </p>
        {isOwnProfile && (
          <Link
            href="/write?category=CONTENT"
            className="inline-block text-[13px] text-theme-primary hover:opacity-80 font-medium"
          >
            {t.profilePage.uploadContent} →
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
