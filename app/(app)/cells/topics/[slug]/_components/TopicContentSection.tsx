/**
 * Server-rendered section showing CONTENT/PHOTO posts related to a topic.
 * Reuses ContentCard from the /contents tab — no extra state needed.
 */
import Link from "next/link";
import { ContentCard } from "@/app/(app)/contents/_components/ContentCard";
import type { PostWithAuthor } from "@/lib/domain/types";
import type { CellTopic } from "@/lib/cells/topics";

type Props = {
  items: PostWithAuthor[];
  topic: CellTopic;
};

export function TopicContentSection({ items, topic }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-theme-border px-4 py-10 text-center space-y-2">
        <span className="text-3xl" aria-hidden>🎬</span>
        <p className="text-[14px] font-medium text-theme-text">
          관련 콘텐츠가 없습니다
        </p>
        <p className="text-[13px] text-theme-muted leading-relaxed">
          {topic.hashtags[0]} 태그가 붙은 유튜브 영상이나 콘텐츠를
          <br />
          올리면 여기에 자동으로 표시됩니다.
        </p>
        <Link
          href="/write"
          className="inline-block mt-1 text-[13px] text-theme-primary hover:opacity-80 font-medium"
        >
          컨텐츠 올리기 →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-theme-border overflow-hidden">
      <ul className="list-none p-0" role="list">
        {items.map((post) => (
          <li key={post.id}>
            <ContentCard post={post} currentUserId={null} />
          </li>
        ))}
      </ul>

      {items.length >= 3 && (
        <div className="px-4 py-3 border-t border-theme-border/40 bg-theme-surface-2/30">
          <Link
            href="/contents"
            className="text-[12px] text-theme-primary hover:opacity-80 font-medium"
          >
            콘텐츠 탭에서 더 보기 →
          </Link>
        </div>
      )}
    </div>
  );
}
