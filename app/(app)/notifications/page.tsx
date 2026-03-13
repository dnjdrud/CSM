import Link from "next/link";
import { getCurrentUser, getUserById } from "@/lib/data/repository";
import { listNotifications } from "@/lib/data/repository";
import { redirect } from "next/navigation";
import { groupNotifications } from "@/lib/notifications/groupNotifications";
import { EmptyState } from "@/components/ui/EmptyState";
import { MarkAllReadButton } from "./_components/MarkAllReadButton";
import { NotificationsListLive } from "./_components/NotificationsListLive";
import { TimelineContainer } from "@/components/TimelineContainer";
import { getServerT } from "@/lib/i18n/server";

export default async function NotificationsPage() {
  const t = await getServerT();
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/onboarding");

  const raw = await listNotifications(currentUser.id);
  const withActors = await Promise.all(
    raw.map(async (n) => ({ ...n, actor: await getUserById(n.actorId) }))
  );
  const grouped = groupNotifications(withActors);
  const hasUnread = withActors.some((n) => !n.readAt);

  return (
    <TimelineContainer>
      <div className="px-4 pt-5 pb-3 border-b border-theme-border">
        <Link
          href="/home"
          className="text-[13px] text-theme-muted hover:text-theme-text focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 rounded mb-3 inline-block"
        >
          {t.common.backHome}
        </Link>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-[18px] font-semibold text-theme-text">
            {t.notifications.title}
          </h1>
          {hasUnread && <MarkAllReadButton />}
        </div>
      </div>
      {grouped.length === 0 ? (
        <div className="px-4 py-6">
          <EmptyState
            title={t.notifications.empty}
            description={t.notifications.emptyDesc}
          />
        </div>
      ) : (
        <NotificationsListLive
          initialWithActors={withActors}
          currentUserId={currentUser.id}
        />
      )}
    </TimelineContainer>
  );
}
