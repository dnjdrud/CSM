import { TimelineContainer } from "@/components/TimelineContainer";
import { listTheologyQuestions } from "@/lib/data/repository";
import Link from "next/link";
import { THEOLOGY_CATEGORY_LABELS, type TheologyCategory } from "@/lib/domain/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "신학 주제 – Cellah" };

const CATEGORY_ICONS: Record<TheologyCategory, string> = {
  GENERAL:      "📖",
  SALVATION:    "✝️",
  ESCHATOLOGY:  "🌅",
  ECCLESIOLOGY: "⛪",
  ETHICS:       "⚖️",
  BIBLE:        "📜",
};

export default async function TheologyTopicsPage() {
  const questions = await listTheologyQuestions({ limit: 200 });

  const byCategory = (Object.keys(THEOLOGY_CATEGORY_LABELS) as TheologyCategory[]).map((cat) => ({
    category: cat,
    label: THEOLOGY_CATEGORY_LABELS[cat],
    icon: CATEGORY_ICONS[cat],
    count: questions.filter((q) => q.category === cat).length,
    recent: questions.filter((q) => q.category === cat).slice(0, 3),
  }));

  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href="/theology" className="text-[12px] text-theme-muted hover:text-theme-primary">← 신학</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">주제별 탐색</h1>
      </div>

      <div className="divide-y divide-theme-border/60">
        {byCategory.map(({ category, label, icon, count, recent }) => (
          <div key={category} className="px-4 py-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{icon}</span>
              <p className="font-medium text-theme-text">{label}</p>
              <span className="text-[12px] text-theme-muted ml-auto">{count}개</span>
            </div>

            {recent.length === 0 ? (
              <p className="text-[12px] text-theme-muted pl-8">아직 질문이 없습니다.</p>
            ) : (
              <div className="pl-8 space-y-1">
                {recent.map((q) => (
                  <Link key={q.id} href={`/theology/${q.id}`}
                    className="block text-[13px] text-theme-muted hover:text-theme-primary transition-colors line-clamp-1">
                    → {q.title}
                  </Link>
                ))}
                {count > 3 && (
                  <Link href={`/theology?category=${category}`} className="text-[12px] text-theme-primary">
                    {count - 3}개 더 보기
                  </Link>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </TimelineContainer>
  );
}
