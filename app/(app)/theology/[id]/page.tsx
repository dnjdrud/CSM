import { TimelineContainer } from "@/components/TimelineContainer";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCurrentUser,
  getTheologyQuestionById,
  listTheologyAnswers,
} from "@/lib/data/repository";
import { THEOLOGY_CATEGORY_LABELS } from "@/lib/domain/types";
import {
  submitAnswerAction,
  voteAnswerAction,
  acceptAnswerAction,
  deleteQuestionAction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function TheologyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const [question, answers] = await Promise.all([
    getTheologyQuestionById(id, user?.id ?? null),
    listTheologyAnswers(id, user?.id ?? null),
  ]);

  if (!question) notFound();

  const isOwner = user?.id === question.userId;
  const accepted = answers.find((a) => a.isAccepted);

  return (
    <TimelineContainer>
      <div className="flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-theme-border flex items-center justify-between">
          <Link href="/theology" className="text-[12px] text-theme-muted hover:text-theme-primary">← 신학</Link>
          {isOwner && (
            <form action={deleteQuestionAction}>
              <input type="hidden" name="id" value={question.id} />
              <button type="submit" className="text-[12px] text-red-500 hover:text-red-700">삭제</button>
            </form>
          )}
        </div>

        {/* Question */}
        <div className="px-4 py-5 border-b border-theme-border">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[11px] bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-full">
              {THEOLOGY_CATEGORY_LABELS[question.category]}
            </span>
            <span className="text-[11px] text-theme-muted">{new Date(question.createdAt).toLocaleDateString("ko-KR")}</span>
          </div>
          <h1 className="text-[16px] font-semibold text-theme-text leading-snug">{question.title}</h1>
          <p className="text-[14px] text-theme-text mt-3 leading-relaxed whitespace-pre-wrap">{question.content}</p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-6 h-6 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary text-[11px] font-semibold">
              {question.author?.name?.charAt(0) ?? "?"}
            </div>
            <Link href={`/profile/${question.userId}`} className="text-[12px] text-theme-muted hover:underline">
              {question.author?.name ?? "알 수 없음"}
            </Link>
          </div>
        </div>

        {/* Answers */}
        <div className="px-4 py-4 space-y-4">
          <p className="text-[14px] font-semibold text-theme-text">
            답변 {answers.length}개{accepted ? " · ✓ 채택된 답변 있음" : ""}
          </p>

          {answers.length === 0 ? (
            <p className="text-[13px] text-theme-muted py-4 text-center">아직 답변이 없습니다. 첫 번째 답변을 남겨주세요!</p>
          ) : (
            answers.map((answer) => (
              <div key={answer.id}
                className={`rounded-xl border px-4 py-4 space-y-3 ${answer.isAccepted ? "border-green-400 bg-green-50 dark:bg-green-900/10" : "border-theme-border bg-theme-surface"}`}>
                {answer.isAccepted && (
                  <p className="text-[12px] font-medium text-green-700 dark:text-green-400">✓ 채택된 답변</p>
                )}
                <p className="text-[14px] text-theme-text leading-relaxed whitespace-pre-wrap">{answer.content}</p>

                {/* Answer meta */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary text-[10px] font-semibold">
                      {answer.author?.name?.charAt(0) ?? "?"}
                    </div>
                    <Link href={`/profile/${answer.userId}`} className="text-[12px] text-theme-muted hover:underline">
                      {answer.author?.name ?? "알 수 없음"}
                    </Link>
                    <span className="text-[11px] text-theme-muted">
                      · {new Date(answer.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>

                  {/* Vote */}
                  {user && (
                    <form action={voteAnswerAction} className="ml-auto">
                      <input type="hidden" name="answerId" value={answer.id} />
                      <input type="hidden" name="questionId" value={question.id} />
                      <button type="submit"
                        className={`flex items-center gap-1 text-[12px] px-2 py-1 rounded-lg border transition-colors ${
                          answer.hasVoted
                            ? "bg-theme-primary/10 border-theme-primary text-theme-primary"
                            : "border-theme-border text-theme-muted hover:bg-theme-surface-2"
                        }`}>
                        👍 {answer.voteCount ?? 0}
                      </button>
                    </form>
                  )}

                  {/* Accept (question owner only) */}
                  {isOwner && !answer.isAccepted && (
                    <form action={acceptAnswerAction}>
                      <input type="hidden" name="answerId" value={answer.id} />
                      <input type="hidden" name="questionId" value={question.id} />
                      <button type="submit" className="text-[12px] text-green-600 hover:text-green-800 border border-green-400 px-2 py-1 rounded-lg">
                        채택
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Submit answer */}
        {user && (
          <div className="px-4 py-4 border-t border-theme-border">
            <form action={submitAnswerAction} className="space-y-3">
              <input type="hidden" name="questionId" value={question.id} />
              <p className="text-[13px] font-medium text-theme-text">답변 작성</p>
              <textarea
                name="content"
                rows={4}
                required
                minLength={10}
                maxLength={3000}
                placeholder="성경과 신학적 근거를 바탕으로 답변해주세요."
                className="w-full rounded-xl border border-theme-border bg-theme-surface px-4 py-3 text-[14px] text-theme-text placeholder-theme-muted resize-none focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
              />
              <button type="submit" className="w-full py-3 rounded-xl bg-theme-primary text-white text-[14px] font-medium hover:opacity-90">
                답변 등록
              </button>
            </form>
          </div>
        )}
      </div>
    </TimelineContainer>
  );
}
