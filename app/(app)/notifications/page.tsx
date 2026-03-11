import Link from "next/link";
import { getCurrentUser, getUserById } from "@/lib/data/repository";
import { listNotifications } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import { groupNotifications } from "@/lib/notifications/groupNotifications";
import { EmptyState } from "@/components/ui/EmptyState";
import { MarkAllReadButton } from "./_components/MarkAllReadButton";
import { NotificationsListLive } from "./_components/NotificationsListLive";

export default async function NotificationsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/onboarding");

  const raw = await listNotifications(currentUser.id);
  const withActors = await Promise.all(
    raw.map(async (n) => ({ ...n, actor: await getUserById(n.actorId) }))
  );
  const grouped = groupNotifications(withActors);
  const hasUnread = withActors.some((n) => !n.readAt);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/feed"
        className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded mb-6 inline-block"
      >
        ← Back to feed
      </Link>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-serif font-normal text-gray-800 tracking-tight">
          Notifications
        </h1>
        {hasUnread && (
          <MarkAllReadButton />
        )}
      </div>
      {grouped.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description="When someone follows you or responds to your posts, you’ll see it here."
        />
      ) : (
        <NotificationsListLive
          initialWithActors={withActors}
          currentUserId={currentUser.id}
        />
      )}
    </div>
  );
}
