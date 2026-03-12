import Link from "next/link";
import { TimelineContainer } from "@/components/TimelineContainer";
import { listOpenCells, getCurrentUser } from "@/lib/data/repository";
import { CELL_TOPICS } from "@/lib/cells/topics";
import { TopicCard } from "./_components/TopicCard";

export const metadata = { title: "셀 – Cellah" };
export const dynamic = "force-dynamic";

export default async function CellsPage() {
  const user = await getCurrentUser();
  const openCells = await listOpenCells();

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
          토픽 게시판을 선택해 들어가거나 셀 나눔 게시글을 올릴 수 있습니다.
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

      {/* ── 셀 나눔 글쓰기 유도 ────────────────────────────────── */}
      <div className="rounded-2xl border border-theme-primary/25 bg-theme-primary/5 px-4 py-4 mb-8 flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-theme-text">셀 나눔 올리기</p>
          <p className="text-[12px] text-theme-muted mt-0.5">
            관심 토픽 태그를 달면 게시판에 자동으로 표시됩니다
          </p>
        </div>
        <Link
          href="/write"
          className="shrink-0 text-[13px] font-semibold text-white bg-theme-primary px-3 py-2 rounded-xl hover:opacity-90 transition-opacity"
        >
          글쓰기
        </Link>
      </div>

      {/* ── 오픈 셀 목록 (기존 채팅방) ─────────────────────────── */}
      {openCells.length > 0 && (
        <section aria-labelledby="cells-heading">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3
              id="cells-heading"
              className="text-[12px] font-semibold text-theme-muted uppercase tracking-wide"
            >
              오픈 셀
            </h3>
            {user && (
              <Link
                href="/cells/new"
                className="text-[12px] text-theme-primary hover:opacity-80"
              >
                + 새 셀
              </Link>
            )}
          </div>

          <ul className="space-y-2">
            {openCells.map((cell) => (
              <li key={cell.id}>
                <Link
                  href={`/cells/${cell.id}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-theme-border bg-theme-surface px-4 py-3 hover:border-theme-primary/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-theme-text truncate">
                      {cell.title}
                    </p>
                    {cell.topicTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {cell.topicTags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] bg-theme-primary/10 text-theme-primary px-1.5 py-0.5 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 text-[12px] text-theme-muted mt-0.5">
                    👥 {cell.memberCount ?? 0}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 오픈 셀 없을 때 + 로그인 상태: 셀 만들기 */}
      {openCells.length === 0 && user && (
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-[12px] font-semibold text-theme-muted uppercase tracking-wide">
              오픈 셀
            </h3>
          </div>
          <div className="rounded-xl border border-dashed border-theme-border px-4 py-8 text-center space-y-2">
            <p className="text-[14px] text-theme-muted">아직 오픈 셀이 없습니다</p>
            <Link
              href="/cells/new"
              className="inline-block text-[13px] font-medium text-theme-primary hover:opacity-80"
            >
              첫 번째 셀 만들기 →
            </Link>
          </div>
        </section>
      )}
    </TimelineContainer>
  );
}
