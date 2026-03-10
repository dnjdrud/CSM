import Link from "next/link";
import { TimelineContainer } from "@/components/TimelineContainer";
import { listOpenCells, getCurrentUser, createCell } from "@/lib/data/repository";
import type { CellType } from "@/lib/domain/types";
import { revalidatePath } from "next/cache";

export const metadata = {
  title: "셀 – Cellah",
};

export const dynamic = "force-dynamic";

async function createCellAction(formData: FormData) {
  "use server";
  const title = formData.get("title")?.toString().trim() ?? "";
  const rawTags = formData.get("topicTags")?.toString().trim() ?? "";
  const type = (formData.get("type")?.toString() ?? "OPEN") as CellType;
  if (!title) return;
  const user = await getCurrentUser();
  if (!user) return;
  const topicTags = rawTags
    ? rawTags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];
  await createCell({ creatorId: user.id, type, title, topicTags });
  revalidatePath("/cell");
}

export default async function CellHomePage() {
  const user = await getCurrentUser();
  const openCells = await listOpenCells();

  return (
    <TimelineContainer>
      <section className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-theme-text">셀 &amp; 메신저</h1>
          <p className="text-sm text-theme-muted mt-1 leading-relaxed">
            오픈 셀은 주제별 기도방으로 누구나 참여할 수 있습니다.
          </p>
        </div>

        {user && (
          <form action={createCellAction} className="bg-theme-surface border border-theme-border rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-theme-text">새 오픈 셀 만들기</h2>
            <input
              name="title"
              placeholder='셀 이름 (예: "2월 말씀 읽기")'
              required
              className="w-full rounded-lg border border-theme-border bg-theme-bg px-3 py-2 text-sm text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/30"
            />
            <input
              name="topicTags"
              placeholder="태그 (쉼표로 구분: 기도, 말씀, 선교)"
              className="w-full rounded-lg border border-theme-border bg-theme-bg px-3 py-2 text-sm text-theme-text placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary/30"
            />
            <input type="hidden" name="type" value="OPEN" />
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-theme-primary text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              만들기
            </button>
          </form>
        )}

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-theme-muted uppercase tracking-wide">
            오픈 셀 ({openCells.length})
          </h2>
          {openCells.length === 0 && (
            <p className="text-center text-theme-muted text-sm py-8">
              아직 셀이 없습니다. 첫 번째 셀을 만들어보세요!
            </p>
          )}
          <ul className="space-y-2">
            {openCells.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/cell/${c.id}`}
                  className="block bg-theme-surface border border-theme-border rounded-xl p-4 hover:border-theme-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-theme-text">{c.title}</span>
                    <span className="text-xs text-theme-muted shrink-0">
                      👥 {c.memberCount ?? 0}
                    </span>
                  </div>
                  {c.topicTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.topicTags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </TimelineContainer>
  );
}
