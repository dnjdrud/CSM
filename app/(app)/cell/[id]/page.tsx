import { notFound } from "next/navigation";
import { TimelineContainer } from "@/components/TimelineContainer";
import { getCurrentUser, getCellById, isMember, getCellMessages, postCellMessage, joinCell } from "@/lib/data/repository";
import { revalidatePath } from "next/cache";
import type { CellMessage } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

async function postMessageAction(formData: FormData) {
  const cellId = formData.get("cellId")?.toString();
  const content = formData.get("content")?.toString().trim();
  if (!cellId || !content) return;
  const user = await getCurrentUser();
  if (!user) return;
  await postCellMessage(cellId, user.id, content);
  revalidatePath(`/cell/${cellId}`);
}

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
  const messages = await getCellMessages(id, 100);

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

        <div className="mt-6 space-y-4">
          {messages.map((m) => (
            <div key={m.id} className="border p-2 rounded">
              <p className="text-sm text-theme-muted">{m.authorId}</p>
              <p>{m.content}</p>
            </div>
          ))}
        </div>

        {member && (
          <form action={postMessageAction} className="mt-6 space-y-2">
            <input type="hidden" name="cellId" value={id} />
            <textarea
              name="content"
              rows={3}
              placeholder="Type a message..."
              className="w-full border p-2"
              required
            />
            <button type="submit" className="px-4 py-2 bg-theme-primary text-white rounded">
              Send
            </button>
          </form>
        )}
      </div>
    </TimelineContainer>
  );
}
