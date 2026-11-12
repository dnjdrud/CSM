import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Room1Entry } from "@/components/Room1Entry";
import { RoomFlow } from "@/components/RoomFlow";
import { ROOM1_INTRO, getRoomPreludeView, parseRoomId } from "@/content/rooms";
import { requireParent } from "@/server/session";

export default async function RoomPage({ params }: PageProps<"/rooms/[roomId]">) {
  // Auth is checked on every request, including refresh and direct URL access.
  const session = await requireParent();
  const { roomId } = await params;
  const id = parseRoomId(roomId);
  if (id === null) notFound();

  const view = getRoomPreludeView(id, session.role);
  if (!view) notFound();

  return (
    <AppShell backHref="/rooms" backLabel="이전" roomsLink logout>
      {view.requiresRecording ? (
        // Only preparation content + entry phrase are sent. The body comes from the enter API after the gate.
        <RoomFlow key={`${id}`} view={view} role={session.role} />
      ) : (
        <Room1Entry title={view.title} paragraphs={ROOM1_INTRO} role={session.role} />
      )}
    </AppShell>
  );
}
