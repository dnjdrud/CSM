import { TimelineContainer } from "@/components/TimelineContainer";
import { getUserById, getCurrentUser, listSharedNotesByUserIdPaged, isBlocked } from "@/lib/data/repository";
import { notFound } from "next/navigation";
import { ProfileListHeader } from "../_components/ProfileListHeader";
import { ProfileViewAllNotes } from "../_components/ProfileViewAllNotes";
import { loadMoreProfileNotesAction } from "../actions";

const INITIAL_LIMIT = 20;

export default async function ProfileNotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, currentUser] = await Promise.all([
    getUserById(id),
    getCurrentUser(),
  ]);

  if (!user) notFound();
  if (!currentUser) notFound();

  const blocked = isBlocked(currentUser.id, id);
  const { items: notes, hasMore: initialHasMore } = blocked
    ? { items: [], hasMore: false }
    : await listSharedNotesByUserIdPaged({ userId: id, limit: INITIAL_LIMIT, offset: 0 });

  return (
    <TimelineContainer>
      <ProfileListHeader
        profileId={id}
        title="공유 노트"
        subtitle="이 분이 공유한 노트입니다."
      />
      <div className="mt-6">
        <ProfileViewAllNotes
          notes={notes}
          profileId={id}
          blocked={blocked}
          emptyTitle="공유된 노트가 없어요."
          emptyDescription="이 분이 공유한 노트가 여기에 표시됩니다."
          initialHasMore={initialHasMore}
          loadMoreAction={loadMoreProfileNotesAction}
        />
      </div>
    </TimelineContainer>
  );
}
