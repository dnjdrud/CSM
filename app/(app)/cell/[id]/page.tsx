import { notFound } from "next/navigation";
import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser, getCellById, isMember, joinCell } from "@/lib/data/repository";
import { revalidatePath } from "next/cache";
import { CellChat } from "./CellChat";

export const dynamic = "force-dynamic";

async function joinCellAction(formData: FormData) {
  const cellId = formData.get("cellId")?.toString();
  if (!cellId) return;
  const user = await getCurrentUser();
  if (!user) return;
  await joinCell(cellId, user.id);
  revalidatePath(`/cell/${cellId}`);
}

export default async function CellPage({ params }: any) {
  const { id } = params;
  const user = await getCurrentUser();
  const cell = await getCellById(id);
  if (!cell) notFound();

  const member = user ? await isMember(id, user.id) : false;

  return (
    <TimelineContainer>
      <div className="px-4 py-8">
        <h1 className="text-xl font-semibold">{cell.title}</h1>
        <p className="text-sm text-theme-muted">{cell.type} cell • created by {cell.creatorId}</p>
        {!member && user && (
          <form action={joinCellAction} className="mt-4">
            <input type="hidden" name="cellId" value={id} />
            <button className="px-4 py-2 bg-theme-primary text-white rounded">
              Join cell
            </button>
          </form>
        )}

        <CellChat cellId={id} userId={user?.id || ""} isMember={member} />
      </div>
    </TimelineContainer>
  );
}
