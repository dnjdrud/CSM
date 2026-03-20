import Link from "next/link";
import type { PostWithAuthor } from "@/lib/domain/types";

type Props = {
  posts: PostWithAuthor[];
  currentUserId: string | null;
  blocked: boolean;
  isOwnProfile: boolean;
};

export function ProfileShortsTab({ posts, currentUserId, blocked, isOwnProfile }: Props) {
  if (blocked) {
    return (
      <div className="px-4 py-12 text-center text-[14px] text-theme-muted">
        이 사용자의 게시글을 볼 수 없습니다.
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="px-4 py-16 text-center space-y-3">
        <span className="text-4xl" aria-hidden>🎬</span>
        <p className="text-[15px] font-medium text-theme-text">
          {isOwnProfile ? "아직 업로드한 숏츠가 없어요" : "업로드된 숏츠가 없습니다"}
        </p>
        {isOwnProfile && (
          <Link
            href="/write?category=SHORTS"
            className="inline-block text-[13px] text-theme-primary hover:opacity-80 font-medium"
          >
            숏츠 올리기 →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-0.5 p-0.5">
      {posts.map((post) => {
        const videoUrl = post.mediaUrls?.[0];
        if (!videoUrl) return null;
        return (
          <Link key={post.id} href={`/post/${post.id}`} className="relative aspect-[9/16] bg-black block overflow-hidden group">
            <video
              src={videoUrl}
              muted
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {post.content && (
              <div
                className="absolute bottom-0 inset-x-0 px-2 pb-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)" }}
              >
                <p className="text-white text-[11px] leading-snug line-clamp-2">{post.content}</p>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
