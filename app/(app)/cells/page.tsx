import { TimelineContainer } from "@/components/TimelineContainer";
import { CELL_TOPICS } from "@/lib/cells/topics";
import { TopicCard } from "./_components/TopicCard";
import Link from "next/link";

export const metadata = { title: "셀 – Cellah" };
export const dynamic = "force-dynamic";

const COMMUNITY_BOARDS = [
  {
    href: "/cells/collab-requests",
    icon: "🤝",
    name: "협업 요청",
    description: "촬영·편집·기획 등 제작 도움이 필요할 때 올리는 보드",
    hashtags: ["#협업", "#제작"],
  },
  {
    href: "/cells/counsel",
    icon: "💡",
    name: "고민상담",
    description: "신학적 질문, 신앙 고민을 묻고 함께 답하는 게시판",
    hashtags: ["#고민상담", "#신학"],
  },
  {
    href: "/mission",
    icon: "🌍",
    name: "선교",
    description: "선교 현장 소식과 기도 요청을 나누는 게시판",
    hashtags: ["#선교", "#기도"],
  },
];

export default async function CellsPage() {
  return (
    <TimelineContainer>
      <h1 className="sr-only">셀</h1>

      {/* 인트로 */}
      <div className="px-1 pt-5 pb-4">
        <p className="text-[11px] font-semibold text-theme-muted uppercase tracking-widest mb-1">
          Cellah 셀
        </p>
        <h2 className="text-[20px] font-bold text-theme-text leading-tight">
          관심사 기반 신앙 공동체
        </h2>
        <p className="text-[13px] text-theme-muted mt-1.5 leading-relaxed">
          같은 관심사를 가진 사람들과 신앙 이야기를 나눠보세요.
        </p>
      </div>

      {/* 게시판 (커뮤니티 보드 + 토픽 통합) */}
      <section aria-labelledby="boards-heading" className="mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3
            id="boards-heading"
            className="text-[12px] font-semibold text-theme-muted uppercase tracking-wide"
          >
            게시판
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {COMMUNITY_BOARDS.map((board) => (
            <Link
              key={board.href}
              href={board.href}
              className="flex flex-col gap-3 rounded-2xl border border-theme-border p-4 bg-theme-surface hover:bg-theme-surface-2 transition-all duration-200 group"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="text-xl w-9 h-9 flex items-center justify-center rounded-xl bg-theme-surface-2 text-theme-text"
                  aria-hidden
                >
                  {board.icon}
                </span>
                <span className="text-[15px] font-semibold text-theme-text transition-colors">
                  {board.name}
                </span>
              </div>
              <p className="text-[12px] text-theme-muted leading-snug">
                {board.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {board.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-theme-surface-2 text-theme-muted border border-theme-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}

          {CELL_TOPICS.map((topic) => (
            <TopicCard key={topic.slug} topic={topic} />
          ))}
        </div>
      </section>
    </TimelineContainer>
  );
}
