import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Notice, Title } from "@/components/ui";
import { listEditableContent } from "@/content/rooms";
import { formatKoreanDate } from "@/lib/entry-rules";
import { requireAdmin } from "@/server/session";

/** Son's list of letters and cards: what parents see now (게시됨) vs. drafts. */
export default async function AdminContentPage() {
  await requireAdmin();
  const items = listEditableContent();
  const groups = [...new Set(items.map((i) => i.group))];
  const shown = items.filter((i) => i.published).length;
  return (
    <AppShell backHref="/admin">
      <Title>편지·카드 관리</Title>
      <Notice>
        부모님께는 <strong>게시한 글만</strong> 보여요. 게시하지 않은 글은 부모님 화면에 “준비 중”으로 나와요. 전체 {items.length}개 중{" "}
        {shown}개 게시됨.
      </Notice>
      {groups.map((g) => (
        <section key={g} className="mt-8" aria-label={g}>
          <h2 className="mb-3 text-2xl font-bold">{g}</h2>
          <ul className="grid gap-3">
            {items
              .filter((i) => i.group === g)
              .map((i) => (
                <li key={i.key}>
                  <Link
                    href={`/admin/content/${encodeURIComponent(i.key)}`}
                    prefetch={false}
                    className="block rounded-2xl border-2 border-line bg-surface p-4 text-text no-underline hover:bg-surface-2"
                  >
                    <span className="block text-xl font-bold">{i.title}</span>
                    <span className="block text-btn">
                      {i.published ? "게시됨 (부모님께 보임)" : "게시 전 (부모님께 안 보임)"}
                      {i.source === "admin" && i.updatedAt ? ` · 고친 날 ${formatKoreanDate(i.updatedAt)}` : " · 처음 초안"}
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </AppShell>
  );
}
