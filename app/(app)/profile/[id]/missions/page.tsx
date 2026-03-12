import { TimelineContainer } from "@/components/TimelineContainer";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getUserById, listMissionaryProjects, getCurrentUser } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export default async function ProfileMissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, viewer, projects] = await Promise.all([
    getUserById(id),
    getCurrentUser(),
    listMissionaryProjects({ missionaryId: id }),
  ]);
  if (!user) notFound();

  return (
    <TimelineContainer>
      <div className="px-4 pt-4 pb-2 border-b border-theme-border">
        <Link href={`/profile/${id}`} className="text-[12px] text-theme-muted hover:text-theme-primary">← {user.name}</Link>
        <h1 className="text-xl font-semibold text-theme-text mt-2">선교 활동</h1>
      </div>

      {projects.length === 0 ? (
        <div className="py-16 text-center text-theme-muted">
          <p className="text-4xl mb-3">🌍</p>
          <p className="text-[14px]">등록된 선교 프로젝트가 없습니다.</p>
        </div>
      ) : (
        <div className="divide-y divide-theme-border/60">
          {projects.map((project) => (
            <Link key={project.id} href={`/missions/${project.id}`} className="block px-4 py-4 hover:bg-theme-surface transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xl shrink-0">🌍</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-theme-text">{project.title}</p>
                    <span className="shrink-0 text-[11px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">진행중</span>
                  </div>
                  <p className="text-[12px] text-theme-muted mt-0.5">{[project.country, project.field].filter(Boolean).join(" · ")}</p>
                  {project.description && (
                    <p className="text-[13px] text-theme-muted mt-1.5 line-clamp-2 leading-relaxed">{project.description}</p>
                  )}
                  <p className="text-[12px] text-theme-muted mt-1">🙏 기도 후원 {project.supporterCount ?? 0}명</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </TimelineContainer>
  );
}
