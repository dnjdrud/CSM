import { TimelineContainer } from "@/components/TimelineContainer";
import { CELL_TOPICS } from "@/lib/cells/topics";
import { TopicCard } from "./_components/TopicCard";

export const metadata = { title: "셀 – Cellah" };
export const dynamic = "force-dynamic";

export default async function CellsPage() {
  return (
    <TimelineContainer>
      <h1 className="sr-only">셀</h1>

      {/* ── 인트로 ─────────────────────────────────────────────── */}
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

      {/* ── 토픽 게시판 ─────────────────────────────────────────── */}
      <section aria-labelledby="topics-heading" className="mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3
            id="topics-heading"
            className="text-[12px] font-semibold text-theme-muted uppercase tracking-wide"
          >
            토픽 게시판
          </h3>
          <span className="text-[11px] text-theme-muted">{CELL_TOPICS.length}개</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {CELL_TOPICS.map((topic) => (
            <TopicCard key={topic.slug} topic={topic} />
          ))}
        </div>
      </section>
    </TimelineContainer>
  );
}
