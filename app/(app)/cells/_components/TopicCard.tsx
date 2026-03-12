import Link from "next/link";
import type { CellTopic } from "@/lib/cells/topics";
import { TOPIC_COLOR_CLASSES } from "@/lib/cells/topics";

type Props = {
  topic: CellTopic;
};

export function TopicCard({ topic }: Props) {
  const colors = TOPIC_COLOR_CLASSES[topic.color] ?? TOPIC_COLOR_CLASSES["blue"]!;

  return (
    <Link
      href={`/cells/topics/${topic.slug}`}
      className={`flex flex-col gap-3 rounded-2xl border p-4 bg-theme-surface hover:shadow-sm transition-all group ${colors.border}`}
    >
      {/* 아이콘 + 이름 */}
      <div className="flex items-center gap-2.5">
        <span
          className={`text-xl w-9 h-9 flex items-center justify-center rounded-xl ${colors.bg}`}
          aria-hidden
        >
          {topic.icon}
        </span>
        <span className={`text-[15px] font-semibold transition-colors group-hover:${colors.text} text-theme-text`}>
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
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${colors.badge}`}
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
