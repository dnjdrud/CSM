import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Title } from "@/components/ui";
import { listRooms } from "@/content/rooms";
import { requireParent } from "@/server/session";

export default async function RoomsPage() {
  await requireParent();
  const rooms = listRooms();

  return (
    <AppShell logout>
      <Title>일곱 개의 방</Title>
      <p className="mb-6">순서는 상관없어요. 보고 싶은 방을 골라주세요.</p>

      <ul className="grid gap-4">
        {rooms.map((r) => (
          <li key={r.id}>
            <Link
              href={`/rooms/${r.id}`}
              prefetch={false}
              className="block rounded-2xl border-2 border-line bg-surface p-5 text-text no-underline hover:bg-surface-2"
            >
              <span className="block text-2xl font-bold">
                <span className="sr-only">방 </span>
                {r.id}. {r.title}
              </span>
              <span className="mt-2 block text-muted">{r.summary}</span>
              <span className="mt-3 block text-lg font-bold text-btn">
                {r.requiresRecording ? "들어가기 전에 한 문장 녹음해요" : "바로 열려요"}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-3">
        <Link href="/notes" className="btn btn-secondary">
          내가 적은 글
        </Link>
        <Link href="/welcome" className="btn btn-secondary">
          처음 안내 다시 보기
        </Link>
      </div>
    </AppShell>
  );
}
