import { AppShell } from "@/components/AppShell";
import { MyEntries } from "@/components/MyEntries";
import { listRooms } from "@/content/rooms";
import { requireParent } from "@/server/session";

export default async function NotesPage() {
  const session = await requireParent();
  const roomTitles = Object.fromEntries(listRooms().map((r) => [r.id, r.title]));
  return (
    <AppShell backHref="/rooms" roomsLink logout>
      <MyEntries role={session.role} roomTitles={roomTitles} />
    </AppShell>
  );
}
