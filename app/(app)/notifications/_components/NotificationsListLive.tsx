"use client";

import { useState, useMemo, useCallback } from "react";
import { FEATURES } from "@/lib/config/features";
import { groupNotifications } from "@/lib/notifications/groupNotifications";
import type { NotificationWithActor } from "@/lib/notifications/groupNotifications";
import { useLiveNotifications } from "./useLiveNotifications";
import { NotificationList } from "./NotificationList";
import { markNotificationsReadAction } from "../actions";

type Props = {
  initialWithActors: NotificationWithActor[];
  currentUserId: string;
};

export function NotificationsListLive({ initialWithActors, currentUserId }: Props) {
  const [list, setList] = useState<NotificationWithActor[]>(initialWithActors);
  useLiveNotifications(currentUserId, setList);
  const grouped = useMemo(() => groupNotifications(list), [list]);

  const handleMarkRead = useCallback(async (ids: string[]) => {
    if (!ids.length) return;
    setList((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n))
    );
    await markNotificationsReadAction(ids);
  }, []);

  return (
    <>
      {FEATURES.REALTIME_NOTIFICATIONS && (
        <p className="mb-2 text-[11px] text-neutral-500" aria-live="polite">
          Live
        </p>
      )}
      <NotificationList grouped={grouped} onMarkRead={handleMarkRead} />
    </>
  );
}
