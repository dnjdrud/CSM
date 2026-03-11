import type { Notification } from "@/lib/domain/types";
import type { User } from "@/lib/domain/types";

export type NotificationWithActor = Notification & { actor: User | null };

export type GroupedNotification = {
  type: string;
  postId?: string;
  actors: User[];
  count: number;
  latestCreatedAt: Date;
  unread: boolean;
  ids: string[];
};

/**
 * Group notifications by (type, postId). Merges matching items into one row.
 * Preserves order by latestCreatedAt desc.
 */
export function groupNotifications(
  notifications: NotificationWithActor[]
): GroupedNotification[] {
  // DMs group per sender (actorId); all others group by (type, postId)
  const key = (n: NotificationWithActor) =>
    n.type === "NEW_MESSAGE" ? `${n.type}:${n.actorId}` : `${n.type}:${n.postId ?? ""}`;
  const map = new Map<string, NotificationWithActor[]>();

  for (const n of notifications) {
    const k = key(n);
    const list = map.get(k) ?? [];
    list.push(n);
    map.set(k, list);
  }

  const groups: GroupedNotification[] = [];

  for (const list of map.values()) {
    const seen = new Set<string>();
    const actors: User[] = [];
    let latestCreatedAt = new Date(0);
    let unread = false;

    for (const n of list) {
      if (n.actor && !seen.has(n.actor.id)) {
        seen.add(n.actor.id);
        actors.push(n.actor);
      }
      const at = new Date(n.createdAt);
      if (at.getTime() > latestCreatedAt.getTime()) latestCreatedAt = at;
      if (!n.readAt) unread = true;
    }

    const first = list[0]!;
    groups.push({
      type: first.type,
      postId: first.postId,
      actors,
      count: list.length,
      latestCreatedAt,
      unread,
      ids: list.map((n) => n.id),
    });
  }

  groups.sort((a, b) => b.latestCreatedAt.getTime() - a.latestCreatedAt.getTime());
  return groups;
}
