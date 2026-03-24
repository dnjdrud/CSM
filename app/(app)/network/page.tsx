import { TimelineContainer } from "@/components/TimelineContainer";
import { listOpenCells, listSuggestedUsers, listMissionaryProjects } from "@/lib/data/repository";
import { getAuthUserId } from "@/lib/auth/session";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "네트워크 – Cellah" };

export default async function NetworkPage() {
  // Cookie read only — full user profile isn't rendered on this page.
  // All three data queries now start in parallel instead of waiting for a DB roundtrip.
  const currentUserId = await getAuthUserId();

  const [cells, missions, suggested] = await Promise.all([
    listOpenCells(),
    listMissionaryProjects({ limit: 3 }),
    currentUserId ? listSuggestedUsers(currentUserId, 6) : Promise.resolve([]),
  ]);

  return (
    <TimelineContainer>
      <div className="flex flex-col">
        <div className="px-4 py-4 border-b border-theme-border">
          <h1 className="text-lg font-semibold text-theme-text">네트워크</h1>
          <nav className="flex gap-4 mt-3 text-[13px]">
            <span className="font-medium text-theme-primary border-b-2 border-theme-primary pb-0.5">홈</span>
            <Link href="/network/suggested" className="text-theme-muted hover:text-theme-text">추천 사람</Link>
            <Link href="/network/cells" className="text-theme-muted hover:text-theme-text">셀</Link>
            <Link href="/network/churches" className="text-theme-muted hover:text-theme-text">교회</Link>
          </nav>
        </div>

        <div className="px-4 py-4 space-y-6">
          {/* Suggested people */}
          {suggested.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium text-theme-text">추천 사람</p>
                <Link href="/network/suggested" className="text-[12px] text-theme-primary">더 보기</Link>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {suggested.slice(0, 4).map((person) => (
                  <Link key={person.id} href={`/profile/${person.id}`}
                    className="flex items-center gap-2 rounded-xl border border-theme-border bg-theme-surface px-3 py-2.5 hover:bg-theme-surface-2 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary text-sm font-semibold shrink-0">
                      {person.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-theme-text truncate">{person.name}</p>
                      <p className="text-[11px] text-theme-muted truncate">{person.affiliation ?? person.role}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Open cells */}
          {cells.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium text-theme-text">오픈 셀</p>
                <Link href="/network/cells" className="text-[12px] text-theme-primary">더 보기</Link>
              </div>
              <div className="space-y-2">
                {cells.slice(0, 3).map((cell) => (
                  <Link key={cell.id} href={`/cells/${cell.id}`}
                    className="flex items-center gap-3 rounded-xl border border-theme-border bg-theme-surface px-3 py-3 hover:bg-theme-surface-2 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-theme-primary/10 flex items-center justify-center text-theme-primary text-base shrink-0">🌐</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-theme-text truncate">{cell.title}</p>
                      <p className="text-[11px] text-theme-muted">멤버 {cell.memberCount ?? 0}명</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Missions */}
          {missions.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium text-theme-text">선교 프로젝트</p>
                <Link href="/missions" className="text-[12px] text-theme-primary">더 보기</Link>
              </div>
              <div className="space-y-2">
                {missions.map((m) => (
                  <Link key={m.id} href={`/missions/${m.id}`}
                    className="flex items-center gap-3 rounded-xl border border-theme-border bg-theme-surface px-3 py-3 hover:bg-theme-surface-2 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-base shrink-0">🌍</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-theme-text truncate">{m.title}</p>
                      <p className="text-[11px] text-theme-muted">{m.country} · 기도 후원 {m.supporterCount ?? 0}명</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </TimelineContainer>
  );
}
