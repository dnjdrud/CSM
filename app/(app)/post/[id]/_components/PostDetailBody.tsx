import Link from "next/link";
import Image from "next/image";
import type { PostWithAuthor } from "@/lib/domain/types";
import { YouTubeEmbed } from "@/components/content/YouTubeEmbed";

type Props = {
  post: PostWithAuthor;
};

export function PostDetailBody({ post }: Props) {
  return (
    <>
      {/* YouTube 임베드 플레이어 */}
      {post.youtubeUrl && (
        <div className="mt-4 rounded-xl overflow-hidden">
          <YouTubeEmbed url={post.youtubeUrl} mode="embed" />
        </div>
      )}

      {/* 첨부 사진 */}
      {Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0 && post.mediaUrls[0] && (
        <div className="mt-4 relative w-full aspect-video rounded-xl overflow-hidden bg-black">
          <Image
            src={post.mediaUrls[0]}
            alt="첨부 사진"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      )}

      <div className="mt-4 text-[15px] leading-7 text-gray-900 whitespace-pre-wrap font-sans">
        {post.content}
      </div>

      {Array.isArray(post.tags) && post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-2 gap-y-0" aria-label="Topics">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/topics/${encodeURIComponent(tag)}`}
              className="text-[13px] text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {post.reflectionPrompt && (
        <aside className="mt-6 pt-6 border-t border-gray-200" aria-label="묵상 질문">
          <p className="text-[13px] font-medium text-gray-700 mb-1">묵상 질문</p>
          <p className="text-[15px] text-gray-800 leading-relaxed italic font-sans">
            {post.reflectionPrompt}
          </p>
        </aside>
      )}
    </>
  );
}
