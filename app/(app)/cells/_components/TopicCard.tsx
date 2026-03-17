import Link from "next/link";
import type { CellTopic } from "@/lib/cells/topics";

type Props = {
  topic: CellTopic;
};

export function TopicCard({ topic }: Props) {
  return (
    <Link
      href={`/cells/topics/${topic.slug}`}
      className="flex flex-col gap-3 rounded-2xl border border-theme-border p-4 bg-theme-surface hover:bg-theme-surface-2 transition-all duration-200 group"
    >
      {/* 아이콘 + 이름 */}
      <div className="flex items-center gap-2.5">
        <span
          className="text-xl w-9 h-9 flex items-center justify-center rounded-xl bg-theme-surface-2 text-theme-text"
          aria-hidden
        >
          {topic.icon}
        </span>
        <span className="text-[15px] font-semibold text-theme-text transition-colors">
          {topic.name}
        </span>
      </div>

      {/* 설명 */}
      <p className="text-[12px] text-theme-muted leading-snug">
        {topic.description}
      </p>

      {/* 해시태그 */}
      <div className="flex flex-wrap gap-1">
        {topic.hashtags.map((tag) => (
          <span
            key={tag}
            className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-theme-surface-2 text-theme-muted border border-theme-border"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
