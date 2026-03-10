import Link from "next/link";
import { TimelineContainer } from "@/components/TimelineContainer";
import { listOpenCells, getCurrentUser, createCell } from "@/lib/data/repository";
import type { CellType } from "@/lib/domain/types";
import { revalidatePath } from "next/cache";

export const metadata = {
  title: "Cells – Cellah",
};

export const dynamic = "force-dynamic";

// server action to handle creation
async function createCellAction(formData: FormData) {
  const title = formData.get("title")?.toString().trim() ?? "";
  const type = (formData.get("type")?.toString() ?? "OPEN") as CellType;
  if (!title) return;
  const user = await getCurrentUser();
  if (!user) return;
  await createCell({ creatorId: user.id, type, title });
  revalidatePath("/cell");
}

export default async function CellHomePage() {
  const user = await getCurrentUser();
  const openCells = await listOpenCells();

  return (
    <TimelineContainer>
      <section className="px-4 py-8 space-y-4">
        <h1 className="text-xl font-semibold text-theme-text">Cell &amp; Messenger</h1>
        <p className="text-sm text-theme-muted leading-relaxed">
          Open Cells allow anyone to join a topic-based prayer room. Private Cells will
          appear here once available.
        </p>
        {user && (
          <form action={createCellAction} className="space-y-2">
            <h2 className="font-semibold">Create a new open cell</h2>
            <input
              name="title"
              placeholder={'Title (e.g. "February Bible Read")'}
              required
              className="w-full border px-2 py-1"
            />
            <input type="hidden" name="type" value="OPEN" />
            <button
              type="submit"
              className="px-4 py-2 bg-theme-primary text-white rounded"
            >
              Create
            </button>
          </form>
        )}
        <ul className="space-y-3">
          {openCells.map((c) => (
            <li key={c.id} className="border p-3 rounded">
              <Link
                href={`/cell/${c.id}`}
                className="text-theme-primary font-medium"
              >
                {c.title}
              </Link>
              <p className="text-sm text-theme-muted">created by {c.creatorId}</p>
            </li>
          ))}
        </ul>
      </section>
    </TimelineContainer>
  );
}

