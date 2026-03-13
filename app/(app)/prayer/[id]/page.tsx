import { TimelineContainer } from "@/components/TimelineContainer";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getPrayerRequestById, listPrayerIntercessions } from "@/lib/data/repository";
import { PRAYER_CATEGORY_LABELS } from "@/lib/domain/types";
import { intercedeAction, removeIntercedeAction, markAnsweredAction } from "../actions";
import { DeletePrayerButton } from "./_components/DeletePrayerButton";

export const dynamic = "force-dynamic";

export default async function PrayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const [prayer, intercessions] = await Promise.all([
    getPrayerRequestById(id, user?.id ?? null),
    listPrayerIntercessions(id),
  ]);

  if (!prayer) notFound();

  const isOwner = user?.id === prayer.userId;
  const isAnswered = !!prayer.answeredAt;

  return (
    <TimelineContainer>
      <div className="flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-theme-border flex items-center justify-between">
          <Link href="/prayer" className="text-[12px] text-theme-muted hover:text-theme-primary">← 기도</Link>
          {isOwner && <DeletePrayerButton prayerRequestId={prayer.id} />}
        </div>

        {/* Prayer content */}
        <div className="px-4 py-5 border-b border-theme-border">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary font-semibold shrink-0">
              {prayer.author?.name?.charAt(0) ?? "?"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/profile/${prayer.userId}`} className="font-medium text-theme-text hover:underline">
                  {prayer.author?.name ?? "알 수 없음"}
                </Link>
                <span className="text-[11px] bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-full">
                  {PRAYER_CATEGORY_LABELS[prayer.category]}
                </span>
                {isAnswered && (
                  <span className="text-[11px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">✓ 응답</span>
                )}
              </div>
              <p className="text-[12px] text-theme-muted mt-0.5">
                {new Date(prayer.createdAt).toLocaleDateString("ko-KR")}
              </p>
            </div>
          </div>

          <p className="text-[15px] text-theme-text mt-4 leading-relaxed whitespace-pre-wrap">{prayer.content}</p>

          {isAnswered && prayer.answerNote && (
            <div className="mt-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3">
              <p className="text-[12px] font-medium text-green-700 dark:text-green-400 mb-1">🎉 기도 응답</p>
              <p className="text-[13px] text-green-800 dark:text-green-300 leading-relaxed">{prayer.answerNote}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-5 flex-wrap">
            {user && !isOwner && (
              prayer.hasPrayed ? (
                <form action={removeIntercedeAction}>
                  <input type="hidden" name="prayerRequestId" value={prayer.id} />
                  <button type="submit" className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-theme-border text-[13px] text-theme-muted hover:bg-theme-surface-2">
                    🙏 기도 취소
                  </button>
                </form>
              ) : (
                <form action={intercedeAction}>
                  <input type="hidden" name="prayerRequestId" value={prayer.id} />
                  <button type="submit" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-theme-primary text-white text-[13px] font-medium hover:opacity-90">
                    🙏 함께 기도하기
                  </button>
                </form>
              )
            )}
            <span className="text-[13px] text-theme-muted">{prayer.intercessorCount ?? 0}명이 기도했습니다</span>

            {isOwner && !isAnswered && (
              <form action={markAnsweredAction} className="ml-auto flex items-center gap-2">
                <input type="hidden" name="prayerRequestId" value={prayer.id} />
                <input
                  type="text"
                  name="answerNote"
                  placeholder="응답 내용 (선택)"
                  className="rounded-lg border border-theme-border bg-theme-surface px-3 py-1.5 text-[13px] text-theme-text placeholder-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-primary/50 w-44"
                />
                <button type="submit" className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-[13px] font-medium hover:bg-green-700">
                  응답 표시
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Intercessions list */}
        <div className="px-4 py-4 space-y-4">
          <p className="text-[13px] font-medium text-theme-text">기도 응원 {intercessions.length > 0 ? `(${intercessions.length})` : ""}</p>

          {intercessions.length === 0 ? (
            <p className="text-[13px] text-theme-muted py-4 text-center">아직 기도 응원이 없습니다. 첫 번째로 기도해 주세요!</p>
          ) : (
            intercessions.map((i) => (
              <div key={i.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary text-sm font-semibold shrink-0">
                  {i.author?.name?.charAt(0) ?? "?"}
                </div>
                <div className="flex-1 rounded-xl bg-theme-surface border border-theme-border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Link href={`/profile/${i.userId}`} className="text-[13px] font-medium text-theme-text hover:underline">
                      {i.author?.name ?? "알 수 없음"}
                    </Link>
                    <span className="text-[11px] text-theme-muted">
                      {new Date(i.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  {i.message && <p className="text-[13px] text-theme-text mt-0.5">{i.message}</p>}
                  {!i.message && <p className="text-[12px] text-theme-muted mt-0.5 italic">🙏 함께 기도했습니다</p>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Intercession with message form */}
        {user && !isOwner && !prayer.hasPrayed && (
          <div className="px-4 py-3 border-t border-theme-border">
            <form action={intercedeAction} className="flex gap-2">
              <input type="hidden" name="prayerRequestId" value={prayer.id} />
              <input
                type="text"
                name="message"
                placeholder="기도 응원 메시지 (선택사항)"
                className="flex-1 rounded-xl border border-theme-border bg-theme-surface px-3 py-2 text-[13px] text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
              />
              <button type="submit" className="px-3 py-2 bg-theme-primary text-white rounded-xl text-[13px] font-medium hover:opacity-90 shrink-0">
                🙏 기도
              </button>
            </form>
          </div>
        )}
      </div>
    </TimelineContainer>
  );
}
