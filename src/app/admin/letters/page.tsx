import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Title } from "@/components/ui";
import { listRooms } from "@/content/rooms";
import { formatKoreanDate } from "@/lib/entry-rules";
import { PARENT_LABEL } from "@/lib/roles";
import { listSharedForSon } from "@/server/entries";
import { requireAdmin } from "@/server/session";

/** Letters parents chose to send. The list shows no body; each opens only when chosen. */
export default async function AdminLettersPage() {
  await requireAdmin();
  const titles = Object.fromEntries(listRooms().map((r) => [r.id, r.title]));
  const items = listSharedForSon();
  return (
    <AppShell backHref="/admin">
      <Title>부모님이 전한 글</Title>
      <p className="mb-6">준비되었을 때 하나씩 열어 읽으세요. 읽었는지는 기록하지 않고 부모님께 알리지도 않아요.</p>
      {items.length === 0 ? (
        <p className="panel">아직 전해진 글이 없어요.</p>
      ) : (
        <ul className="grid gap-3">
          {items.map((i) => (
            <li key={i.id}>
              <Link href={`/admin/letters/${i.id}`} prefetch={false} className="block rounded-2xl border-2 border-line bg-surface p-4 text-text no-underline hover:bg-surface-2">
                <span className="block text-2xl font-bold">{PARENT_LABEL[i.owner]}의 글</span>
                <span className="block text-muted">
                  {i.roomId}번 방 · {titles[i.roomId]} · {formatKoreanDate(i.sharedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
