import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Title } from "@/components/ui";
import { listRooms } from "@/content/rooms";
import { formatKoreanDate } from "@/lib/entry-rules";
import { PARENT_LABEL } from "@/lib/roles";
import { UUID_RE } from "@/server/api-helpers";
import { getSharedForSon } from "@/server/entries";
import { requireAdmin } from "@/server/session";

export default async function AdminLetterPage({ params }: PageProps<"/admin/letters/[id]">) {
  await requireAdmin();
  const { id } = await params;
  // Only shared entries exist for the son; sealed ids look exactly like missing ones.
  const item = UUID_RE.test(id) ? getSharedForSon(id) : null;
  if (!item) notFound();
  const room = listRooms().find((r) => r.id === item.roomId);
  return (
    <AppShell backHref="/admin/letters" backLabel="목록">
      <p className="mb-2 text-muted">
        {PARENT_LABEL[item.owner]} · {item.roomId}번 방 {room ? `· ${room.title}` : ""}
      </p>
      <Title>{item.title || "제목 없음"}</Title>
      <article className="panel">
        {/* Plain text rendering (React escapes it); no HTML from parents is ever interpreted. */}
        <p className="whitespace-pre-wrap">{item.body}</p>
      </article>
      <p className="mt-4 text-muted">
        전한 날: {formatKoreanDate(item.sharedAt)}
        {item.updatedAt !== item.sharedAt ? ` · 고친 날: ${formatKoreanDate(item.updatedAt)}` : ""}
      </p>
    </AppShell>
  );
}
