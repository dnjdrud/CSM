import Link from "next/link";
import Image from "next/image";
import { Avatar } from "@/components/ui/Avatar";
import { YouTubeEmbed } from "@/components/content/YouTubeEmbed";
import type { PostWithAuthor } from "@/lib/domain/types";
import type { MissionCountry } from "@/lib/mission/countries";
import { relativeTimeKo } from "@/lib/utils/time";

function MissionPostCard({ post }: { post: PostWithAuthor }) {
  return (
    <article className="px-4 py-4">
      <div className="flex items-center gap-2.5 mb-2.5">
        <Link
          href={`/profile/${post.author.id}`}
          className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary rounded-full"
        >
          <Avatar name={post.author.name} src={post.author.avatarUrl} size="sm" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${post.author.id}`}
            className="text-[13px] font-medium text-theme-text hover:underline"
          >
            {post.author.name}
          </Link>
        </div>
        <time dateTime={post.createdAt} className="text-[12px] text-theme-muted shrink-0">
          {relativeTimeKo(post.createdAt)}
        </time>
      </div>

      <Link href={`/post/${post.id}`} className="block group">
        <p className="text-[14px] text-theme-text leading-relaxed line-clamp-4 whitespace-pre-wrap group-hover:text-theme-primary/90 transition-colors pl-[38px]">
          {post.content}
        </p>
      </Link>

      {post.youtubeUrl && (
        <div className="mt-2 pl-[38px] rounded-xl overflow-hidden">
          <YouTubeEmbed url={post.youtubeUrl} mode="player" />
        </div>
      )}

      {!post.youtubeUrl && Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0 && post.mediaUrls[0] && (
        <div className="mt-2 pl-[38px]">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
            <Image src={post.mediaUrls[0]} alt="첨부 사진" fill className="object-contain" unoptimized />
          </div>
        </div>
      )}

      {Array.isArray(post.tags) && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 pl-[38px]">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-theme-accent-bg text-theme-primary"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {(post.commentCount ?? 0) > 0 && (
        <div className="mt-2 pl-[38px]">
          <Link
            href={`/post/${post.id}`}
            className="text-[12px] text-theme-muted hover:text-theme-text transition-colors"
          >
            댓글 {post.commentCount}개 보기
          </Link>
        </div>
      )}
    </article>
  );
}

type Props = {
  items: PostWithAuthor[];
  country: MissionCountry;
  writeUrl: string;
};

export function MissionFeedSection({ items, country, writeUrl }: Props) {
  if (items.length === 0) {
    return (
      <div className="px-4 py-14 text-center space-y-3">
        <span className="text-4xl" aria-hidden>{country.flag}</span>
        <p className="text-[15px] font-medium text-theme-text">
          아직 선교 소식이 없습니다
        </p>
        <p className="text-[14px] text-theme-muted leading-relaxed">
          첫 번째 선교 소식을 올려보세요.
          <br />
          글쓰기에서 <strong>선교</strong>를 선택하고
          <br />
          <strong>#{country.tags[0]}</strong> 태그를 추가하면 여기에 표시됩니다.
        </p>
        <Link
          href={writeUrl}
          className="inline-block mt-2 text-[13px] text-theme-primary hover:opacity-80 font-medium"
        >
          선교 소식 올리기 →
        </Link>
      </div>
    );
  }

  return (
    <ul className="list-none p-0 space-y-4" role="list">
      {items.map((post) => (
        <li key={post.id}>
          <MissionPostCard post={post} />
        </li>
      ))}
    </ul>
  );
}
