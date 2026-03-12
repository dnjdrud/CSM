import { TimelineContainer } from "@/components/TimelineContainer";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getUserById, listPrayerRequests, getCurrentUser } from "@/lib/data/repository";
import { PRAYER_CATEGORY_LABELS } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

export default async function ProfilePrayersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, viewer] = await Promise.all([getUserById(id), getCurrentUser()]);
  if (!user) notFound();

  const prayers = await listPrayerRequests({ userId: id, viewerId: viewer?.id ?? null });

  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href={`/profile/${id}`} className="text-[12px] text-theme-muted hover:text-theme-primary">← {user.name}</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">기도 제목</h1>
      </div>

      {prayers.length === 0 ? (
        <div className="py-16 text-center text-theme-muted">
          <p className="text-4xl mb-3">🙏</p>
          <p className="text-[14px]">공개된 기도제목이 없습니다.</p>
        </div>
      ) : (
        <div className="divide-y divide-theme-border/60">
          {prayers.map((prayer) => (
            <Link key={prayer.id} href={`/prayer/${prayer.id}`} className="block px-4 py-4 hover:bg-theme-surface transition-colors">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-full">
                  {PRAYER_CATEGORY_LABELS[prayer.category]}
                </span>
                {prayer.answeredAt && (
                  <span className="text-[11px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">✓ 응답</span>
                )}
                <span className="text-[11px] text-theme-muted ml-auto">
                  {new Date(prayer.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </div>
              <p className="text-[14px] text-theme-text mt-1.5 line-clamp-2 leading-relaxed">{prayer.content}</p>
              <p className="text-[12px] text-theme-muted mt-1">🙏 {prayer.intercessorCount ?? 0}명이 기도했습니다</p>
            </Link>
          ))}
        </div>
      )}
    </TimelineContainer>
  );
}
