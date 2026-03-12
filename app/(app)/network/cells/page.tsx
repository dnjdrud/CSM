import { TimelineContainer } from "@/components/TimelineContainer";
import { listOpenCells } from "@/lib/data/repository";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "셀 네트워크 – Cellah" };

export default async function NetworkCellsPage() {
  const cells = await listOpenCells();

  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href="/network" className="text-[12px] text-theme-muted hover:text-theme-primary">← 네트워크</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">셀 네트워크</h1>
        <p className="text-[12px] text-theme-muted mt-0.5">오픈 셀 {cells.length}개</p>
      </div>

      {cells.length === 0 ? (
        <div className="py-16 text-center text-theme-muted">
          <p className="text-4xl mb-3">🔗</p>
          <p className="text-[14px]">등록된 오픈 셀이 없습니다.</p>
          <Link href="/cells" className="mt-3 inline-block text-sm text-theme-primary underline">셀 만들기</Link>
        </div>
      ) : (
        <div className="divide-y divide-theme-border/60">
          {cells.map((cell) => (
            <Link key={cell.id} href={`/cells/${cell.id}`} className="block px-4 py-4 hover:bg-theme-surface transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-theme-primary/10 flex items-center justify-center text-theme-primary text-lg shrink-0">🌐</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-theme-text">{cell.title}</p>
                  <p className="text-[12px] text-theme-muted mt-0.5">멤버 {cell.memberCount ?? 0}명</p>
                  {cell.topicTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {cell.topicTags.map((tag) => (
                        <span key={tag} className="text-[11px] bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-full">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="shrink-0 text-[12px] text-theme-primary border border-theme-primary px-2 py-1 rounded-lg">참여</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </TimelineContainer>
  );
}
