import { TimelineContainer } from "@/components/TimelineContainer";
import Link from "next/link";
import { searchPeople } from "@/lib/data/repository";
import { getAuthUserId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "교회 – Cellah" };

export default async function NetworkChurchesPage() {
  const viewerId = await getAuthUserId();
  // Use searchPeople to get all users, then group by church
  const people = viewerId
    ? await searchPeople({ q: "", viewerId })
    : [];

  // Group users by church field
  const churchMap = new Map<string, typeof people>();
  for (const person of people) {
    const church = person.church ?? person.affiliation;
    if (!church) continue;
    if (!churchMap.has(church)) churchMap.set(church, []);
    churchMap.get(church)!.push(person);
  }
  const churches = Array.from(churchMap.entries())
    .sort((a, b) => b[1].length - a[1].length);

  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href="/network" className="text-[12px] text-theme-muted hover:text-theme-primary">← 네트워크</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">교회</h1>
        <p className="text-[12px] text-theme-muted mt-0.5">Cellah에 등록된 교회 {churches.length}곳</p>
      </div>

      {churches.length === 0 ? (
        <div className="py-16 text-center text-theme-muted">
          <p className="text-4xl mb-3">⛪</p>
          <p className="text-[14px]">등록된 교회 정보가 없습니다.</p>
          <p className="text-[12px] mt-1">프로필에서 교회를 입력하면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div className="divide-y divide-theme-border/60">
          {churches.map(([church, members]) => (
            <div key={church} className="px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-lg shrink-0">⛪</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-theme-text">{church}</p>
                  <p className="text-[12px] text-theme-muted mt-0.5">멤버 {members.length}명</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3 pl-13">
                {members.slice(0, 5).map((m) => (
                  <Link key={m.id} href={`/profile/${m.id}`}
                    className="flex items-center gap-1.5 text-[12px] text-theme-muted hover:text-theme-primary transition-colors">
                    <span className="w-5 h-5 rounded-full bg-theme-primary/20 text-theme-primary text-[10px] flex items-center justify-center font-medium">
                      {m.name.charAt(0)}
                    </span>
                    {m.name}
                  </Link>
                ))}
                {members.length > 5 && (
                  <span className="text-[12px] text-theme-muted">외 {members.length - 5}명</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </TimelineContainer>
  );
}
