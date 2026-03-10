import { notFound, redirect } from "next/navigation";
import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser, getCellById, isMember, joinCell, leaveCell } from "@/lib/data/repository";
import { revalidatePath } from "next/cache";
import { CellChat } from "./CellChat";
import { CellInvitePanel } from "./CellInvitePanel";

export const dynamic = "force-dynamic";

async function joinCellAction(formData: FormData) {
  "use server";
  const cellId = formData.get("cellId")?.toString();
  if (!cellId) return;
  const user = await getCurrentUser();
  if (!user) return;
  await joinCell(cellId, user.id);
  revalidatePath(`/cell/${cellId}`);
}

async function leaveCellAction(formData: FormData) {
  "use server";
  const cellId = formData.get("cellId")?.toString();
  if (!cellId) return;
  const user = await getCurrentUser();
  if (!user) return;
  await leaveCell(cellId, user.id);
  redirect("/cell");
}

export default async function CellPage({ params }: { params: Promise<{ id: string }> }) {
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
              <h1 className="text-lg font-semibold text-theme-text truncate">{cell.title}</h1>
              <p className="text-xs text-theme-muted mt-0.5">
                {isPrivate ? "🔒 프라이빗 셀" : "🌐 오픈 셀"}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              {/* 멤버 초대: 셀 멤버라면 누구나 */}
              {member && user && <CellInvitePanel cellId={id} />}

              {/* 오픈 셀: 비멤버에게 참여 버튼 */}
              {!member && user && (
                <form action={joinCellAction}>
                  <input type="hidden" name="cellId" value={id} />
                  <button className="px-3 py-1.5 text-sm font-medium bg-theme-primary text-white rounded-lg hover:opacity-90 transition-opacity">
                    참여
                  </button>
                </form>
              )}

              {/* 나가기: Private 셀 + 비크리에이터 멤버만 */}
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
                <span
                  key={tag}
                  className="text-xs bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Chat */}
        <CellChat cellId={id} userId={user?.id ?? ""} userName={user?.name ?? ""} isMember={member} />
      </div>
    </TimelineContainer>
  );
}
