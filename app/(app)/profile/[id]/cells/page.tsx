import { TimelineContainer } from "@/components/TimelineContainer";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getUserById, listCellsByUserId } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export default async function ProfileCellsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, cells] = await Promise.all([getUserById(id), listCellsByUserId(id)]);
  if (!user) notFound();

  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href={`/profile/${id}`} className="text-[12px] text-theme-muted hover:text-theme-primary">← {user.name}</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">참여 셀</h1>
      </div>

      {cells.length === 0 ? (
        <div className="py-16 text-center text-theme-muted">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-[14px]">참여 중인 셀이 없습니다.</p>
        </div>
      ) : (
        <div className="divide-y divide-theme-border/60">
          {cells.map((cell) => (
            <Link key={cell.id} href={`/cells/${cell.id}`} className="block px-4 py-4 hover:bg-theme-surface transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-theme-primary/10 flex items-center justify-center text-theme-primary text-lg shrink-0">
                  {cell.type === "PRIVATE" ? "🔒" : "🌐"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-theme-text truncate">{cell.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[12px] text-theme-muted">{cell.type === "PRIVATE" ? "프라이빗" : "오픈"} 셀</span>
                    {cell.memberCount !== undefined && (
                      <span className="text-[12px] text-theme-muted">· 멤버 {cell.memberCount}명</span>
                    )}
                  </div>
                  {cell.topicTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {cell.topicTags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[11px] bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-full">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </TimelineContainer>
  );
}
