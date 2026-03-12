import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser, listTheologyQuestions } from "@/lib/data/repository";
import Link from "next/link";
import { THEOLOGY_CATEGORY_LABELS } from "@/lib/domain/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "신학 Q&A – Cellah" };

export default async function TheologyPage() {
  const [user, questions] = await Promise.all([
    getCurrentUser(),
    listTheologyQuestions(),
  ]);

  return (
    <TimelineContainer>
      <div className="flex flex-col">
        <div className="px-4 py-4 border-b border-theme-border">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-theme-text">신학 Q&A</h1>
            {user && (
              <Link href="/theology/ask" className="px-3 py-1.5 text-sm font-medium bg-theme-primary text-white rounded-lg hover:opacity-90">
                + 질문하기
              </Link>
            )}
          </div>
          <nav className="flex gap-3 mt-3 text-[13px] overflow-x-auto">
            <Link href="/theology" className="font-medium text-theme-primary border-b-2 border-theme-primary pb-0.5 shrink-0">전체</Link>
            <Link href="/theology/topics" className="text-theme-muted hover:text-theme-text shrink-0">주제별</Link>
          </nav>
        </div>

        {questions.length === 0 ? (
          <div className="py-16 text-center text-theme-muted">
            <p className="text-4xl mb-3">✝️</p>
            <p className="text-[14px]">아직 등록된 질문이 없습니다.</p>
            {user && (
              <Link href="/theology/ask" className="mt-3 inline-block text-sm text-theme-primary underline">첫 질문 등록하기</Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-theme-border/60">
            {questions.map((q) => (
              <Link key={q.id} href={`/theology/${q.id}`} className="block px-4 py-4 hover:bg-theme-surface transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary text-sm font-semibold shrink-0">
                    {q.author?.name?.charAt(0) ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-full">
                        {THEOLOGY_CATEGORY_LABELS[q.category]}
                      </span>
                      <span className="text-[11px] text-theme-muted">
                        {new Date(q.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                    <p className="text-[14px] font-medium text-theme-text mt-1">{q.title}</p>
                    <p className="text-[13px] text-theme-muted mt-0.5 line-clamp-1">{q.content}</p>
                    <p className="text-[12px] text-theme-muted mt-1.5">💬 답변 {q.answerCount ?? 0}개</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </TimelineContainer>
  );
}
