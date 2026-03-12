import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser, listPrayerRequests } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PRAYER_CATEGORY_LABELS } from "@/lib/domain/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "내 기도 – Cellah" };

export default async function MyPrayerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const prayers = await listPrayerRequests({ userId: user.id, viewerId: user.id });
  const answered = prayers.filter((p) => !!p.answeredAt);
  const ongoing = prayers.filter((p) => !p.answeredAt);

  return (
    <TimelineContainer>
      <div className="flex flex-col">
        <div className="px-4 py-4 border-b border-theme-border">
          <Link href="/prayer" className="text-[12px] text-theme-muted hover:text-theme-primary">← 기도</Link>
          <div className="flex items-center justify-between mt-2">
            <h1 className="text-xl font-semibold text-theme-text">내 기도</h1>
            <Link href="/prayer/create" className="px-3 py-1.5 text-sm font-medium bg-theme-primary text-white rounded-lg hover:opacity-90">
              + 기도 요청
            </Link>
          </div>
          <div className="flex gap-4 mt-1 text-[13px] text-theme-muted">
            <span>진행 중 {ongoing.length}</span>
            <span>응답 {answered.length}</span>
          </div>
        </div>

        {prayers.length === 0 ? (
          <div className="py-16 text-center text-theme-muted">
            <p className="text-4xl mb-3">📖</p>
            <p className="text-[14px]">아직 기도제목이 없습니다.</p>
            <Link href="/prayer/create" className="mt-4 inline-block text-sm text-theme-primary underline">
              첫 번째 기도제목 등록하기
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-theme-border/60">
            {prayers.map((prayer) => (
              <Link key={prayer.id} href={`/prayer/${prayer.id}`} className="block px-4 py-4 hover:bg-theme-surface transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-full">
                        {PRAYER_CATEGORY_LABELS[prayer.category]}
                      </span>
                      {prayer.answeredAt && (
                        <span className="text-[11px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">✓ 응답</span>
                      )}
                      <span className="text-[11px] text-theme-muted">
                        {new Date(prayer.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                    <p className="text-[14px] text-theme-text mt-1 line-clamp-2 leading-relaxed">{prayer.content}</p>
                    <p className="text-[12px] text-theme-muted mt-1">🙏 {prayer.intercessorCount ?? 0}명이 기도했습니다</p>
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
