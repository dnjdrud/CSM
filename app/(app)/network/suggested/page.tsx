import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser, listSuggestedUsers } from "@/lib/data/repository";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "추천 – Cellah" };

export default async function NetworkSuggestedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const people = await listSuggestedUsers(user.id, 30);

  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href="/network" className="text-[12px] text-theme-muted hover:text-theme-primary">← 네트워크</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">추천 사람</h1>
      </div>

      {people.length === 0 ? (
        <div className="py-16 text-center text-theme-muted">
          <p className="text-4xl mb-3">✨</p>
          <p className="text-[14px]">더 추천할 사람이 없습니다.</p>
        </div>
      ) : (
        <div className="divide-y divide-theme-border/60">
          {people.map((person) => (
            <Link key={person.id} href={`/profile/${person.id}`} className="flex items-center gap-3 px-4 py-4 hover:bg-theme-surface transition-colors">
              <div className="w-10 h-10 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary font-semibold shrink-0">
                {person.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-theme-text">{person.name}</p>
                <p className="text-[12px] text-theme-muted mt-0.5">
                  {[person.affiliation, person.church].filter(Boolean).join(" · ") || person.role}
                </p>
                {person.bio && <p className="text-[12px] text-theme-muted mt-0.5 line-clamp-1">{person.bio}</p>}
              </div>
              <span className="shrink-0 text-[12px] text-theme-primary border border-theme-primary px-2 py-1 rounded-lg">팔로우</span>
            </Link>
          ))}
        </div>
      )}
    </TimelineContainer>
  );
}
