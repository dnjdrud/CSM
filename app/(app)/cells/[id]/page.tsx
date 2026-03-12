import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser, getCellById, isMember, joinCell, leaveCell } from "@/lib/data/repository";
import { revalidatePath } from "next/cache";
import { CellChat } from "../../cell/[id]/CellChat";
import { CellInvitePanel } from "../../cell/[id]/CellInvitePanel";

export const dynamic = "force-dynamic";

async function joinCellAction(formData: FormData) {
  "use server";
  const cellId = formData.get("cellId")?.toString();
  if (!cellId) return;
  const user = await getCurrentUser();
  if (!user) return;
  await joinCell(cellId, user.id);
  revalidatePath(`/cells/${cellId}`);
}

async function leaveCellAction(formData: FormData) {
  "use server";
  const cellId = formData.get("cellId")?.toString();
  if (!cellId) return;
  const user = await getCurrentUser();
  if (!user) return;
  await leaveCell(cellId, user.id);
  redirect("/cells");
}

export default async function CellsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const cell = await getCellById(id);
  if (!cell) notFound();

  const member = user ? await isMember(id, user.id) : false;
  const isCreator = user?.id === cell.creatorId;
  const isPrivate = cell.type === "PRIVATE";

  return (
    <TimelineContainer>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-4 border-b border-theme-border">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link href="/cells" className="text-[12px] text-theme-muted hover:text-theme-primary mb-1 inline-block">
                ← 셀 목록
              </Link>
              <h1 className="text-lg font-semibold text-theme-text truncate">{cell.title}</h1>
              <p className="text-xs text-theme-muted mt-0.5">
                {isPrivate ? "🔒 프라이빗 셀" : "🌐 오픈 셀"}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              {member && user && <CellInvitePanel cellId={id} />}
              {!member && user && (
                <form action={joinCellAction}>
                  <input type="hidden" name="cellId" value={id} />
                  <button className="px-3 py-1.5 text-sm font-medium bg-theme-primary text-white rounded-lg hover:opacity-90 transition-opacity">
                    참여
                  </button>
                </form>
              )}
              {isPrivate && member && !isCreator && (
                <form action={leaveCellAction}>
                  <input type="hidden" name="cellId" value={id} />
                  <button className="px-3 py-1.5 text-sm text-theme-muted border border-theme-border rounded-lg hover:bg-theme-surface transition-colors">
                    나가기
                  </button>
                </form>
              )}
            </div>
          </div>

          {cell.topicTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {cell.topicTags.map((tag) => (
                <span key={tag} className="text-xs bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Sub-nav */}
          {member && (
            <nav className="flex gap-3 mt-3 text-[13px]" aria-label="셀 메뉴">
              <Link href={`/cells/${id}`} className="font-medium text-theme-primary border-b-2 border-theme-primary pb-0.5">채팅</Link>
              <Link href={`/cells/${id}/posts`} className="text-theme-muted hover:text-theme-text">게시판</Link>
              <Link href={`/cells/${id}/prayer`} className="text-theme-muted hover:text-theme-text">기도제목</Link>
              <Link href={`/cells/${id}/meetings`} className="text-theme-muted hover:text-theme-text">모임</Link>
              <Link href={`/cells/${id}/members`} className="text-theme-muted hover:text-theme-text">멤버</Link>
            </nav>
          )}
        </div>

        <CellChat cellId={id} userId={user?.id ?? ""} userName={user?.name ?? ""} isMember={member} />
      </div>
    </TimelineContainer>
  );
}
