"use client";

import { useEffect, useRef } from "react";
import { FEATURES } from "@/lib/config/features";
import { subscribeToTable } from "@/lib/supabase/realtime";
import type { NotificationWithActor } from "@/lib/notifications/groupNotifications";
import type { NotificationType, User } from "@/lib/domain/types";
import { getPublicUserAction } from "../actions";

const EVENT_NEW = "csm:notification-new";
const EVENT_READ = "csm:notification-read";

function rowToNotification(row: {
  id: string;
  type: string;
  recipient_id: string;
  actor_id: string;
  post_id?: string | null;
  read_at?: string | null;
  created_at?: string | null;
}): NotificationWithActor {
  return {
    id: row.id,
    type: row.type as NotificationType,
    recipientId: row.recipient_id,
    actorId: row.actor_id,
    postId: row.post_id ?? undefined,
    readAt: row.read_at ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
    actor: null,
  };
}

/**
 * Subscribe to notifications for current user. Updates list and dispatches badge events.
 * Returns unsubscribe. Call in useEffect and cleanup on unmount.
 */
export function useLiveNotifications(
  recipientId: string | null,
  setList: React.Dispatch<React.SetStateAction<NotificationWithActor[]>>
) {
  const setListRef = useRef(setList);
  setListRef.current = setList;

  useEffect(() => {
    if (!FEATURES.REALTIME_NOTIFICATIONS || !recipientId) return;

    const unsub = subscribeToTable<{
      id: string;
      type: string;
      recipient_id: string;
      actor_id: string;
      post_id?: string | null;
      read_at?: string | null;
      created_at?: string | null;
    }>({
      table: "notifications",
      filter: `recipient_id=eq.${recipientId}`,
      onInsert: (payload) => {
        const row = payload.new;
        if (!row?.id) return;
        const n = rowToNotification(row);
        setListRef.current((prev) => {
          if (prev.some((x) => x.id === n.id)) return prev;
          const next = [n, ...prev];
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent(EVENT_NEW));
          }
          getPublicUserAction(row.actor_id).then((user) => {
            if (!user) return;
            setListRef.current((p) =>
              p.map((x) => (x.id === n.id ? { ...x, actor: user as User } : x))
            );
          });
          return next;
        });
      },
      onUpdate: (payload) => {
        const row = payload.new;
        if (!row?.id) return;
        const hadRead = (payload.old as { read_at?: string | null })?.read_at;
        const nowRead = row.read_at;
        setListRef.current((prev) => {
          const idx = prev.findIndex((x) => x.id === row.id);
          if (idx < 0) return prev;
          if (!hadRead && nowRead && typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent(EVENT_READ));
          }
          return prev.map((x) =>
            x.id === row.id
              ? {
                  ...x,
                  readAt: row.read_at ?? undefined,
                }
              : x
          );
        });
      },
    });

    return unsub;
  }, [recipientId]);
}

export { EVENT_NEW, EVENT_READ };
