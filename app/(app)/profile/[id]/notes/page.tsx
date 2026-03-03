import Link from "next/link";
import { TimelineContainer } from "@/components/TimelineContainer";
import { getUserById, getCurrentUser, listSharedNotesByUserId, isBlocked } from "@/lib/data/repository";
import { notFound } from "next/navigation";
import { ProfileListHeader } from "../_components/ProfileListHeader";
import { ProfileViewAllNotes } from "../_components/ProfileViewAllNotes";

export default async function ProfileNotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, currentUser, sharedNotes] = await Promise.all([
    getUserById(id),
    getCurrentUser(),
    listSharedNotesByUserId({ userId: id, limit: 200 }),
  ]);

  if (!user) notFound();
  if (!currentUser) notFound();

  const blocked = isBlocked(currentUser.id, id);
  const sorted = [...sharedNotes].sort((a, b) => {
    const aAt = a.updatedAt ?? a.createdAt;
    const bAt = b.updatedAt ?? b.createdAt;
    return new Date(bAt).getTime() - new Date(aAt).getTime();
  });

  return (
    <TimelineContainer>
      <ProfileListHeader
        profileId={id}
        title="Shared notes"
        subtitle="Notes this person chose to share."
      />
      <div className="mt-6">
        <ProfileViewAllNotes
          notes={sorted}
          profileId={id}
          blocked={blocked}
          emptyTitle="No shared notes yet."
          emptyDescription="Notes this person chose to share will appear here."
        />
      </div>
    </TimelineContainer>
  );
}
