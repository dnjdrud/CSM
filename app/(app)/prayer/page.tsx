import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser, listPrayerRequests } from "@/lib/data/repository";
import Link from "next/link";
import { PRAYER_CATEGORY_LABELS } from "@/lib/domain/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "기도 – Cellah" };

export default async function PrayerPage() {
  const user = await getCurrentUser();
  const prayers = await listPrayerRequests({ viewerId: user?.id ?? null });

  return (
    <TimelineContainer>
      <div className="flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-theme-border">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-theme-text">기도</h1>
            {user && (
              <Link
                href="/prayer/create"
                className="px-3 py-1.5 text-sm font-medium bg-theme-primary text-white rounded-lg hover:opacity-90"
              >
                + 기도 요청
              </Link>
            )}
          </div>
          <nav className="flex gap-4 mt-3 text-[13px]">
            <span className="font-medium text-theme-primary border-b-2 border-theme-primary pb-0.5">전체</span>
            {user && <Link href="/prayer/my" className="text-theme-muted hover:text-theme-text">내 기도</Link>}
            <Link href="/prayer/chains" className="text-theme-muted hover:text-theme-text">기도 체인</Link>
          </nav>
        </div>

        {prayers.length === 0 ? (
          <div className="py-16 text-center text-theme-muted">
            <p className="text-4xl mb-3">🙏</p>
            <p className="text-[14px]">아직 등록된 기도제목이 없습니다.</p>
            {user && (
              <Link href="/prayer/create" className="mt-4 inline-block text-sm text-theme-primary underline">
                첫 번째 기도제목 나누기
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-theme-border/60">
            {prayers.map((prayer) => {
              const initial = prayer.author?.name?.charAt(0) ?? "?";
              return (
                <Link key={prayer.id} href={`/prayer/${prayer.id}`} className="block px-4 py-4 hover:bg-theme-surface transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary font-semibold text-sm shrink-0">
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-medium text-theme-text">{prayer.author?.name ?? "알 수 없음"}</span>
                        <span className="text-[11px] bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-full">
                          {PRAYER_CATEGORY_LABELS[prayer.category]}
                        </span>
                        {prayer.answeredAt && (
                          <span className="text-[11px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">✓ 응답</span>
                        )}
                        <span className="text-[12px] text-theme-muted ml-auto">
                          {new Date(prayer.createdAt).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                      <p className="text-[14px] text-theme-text mt-1 line-clamp-2 leading-relaxed">{prayer.content}</p>
                      <p className="text-[12px] text-theme-muted mt-1.5">🙏 {prayer.intercessorCount ?? 0}명이 기도했습니다</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </TimelineContainer>
  );
}
