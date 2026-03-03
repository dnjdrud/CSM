"use client";

import Link from "next/link";
import type { GroupedNotification } from "@/lib/notifications/groupNotifications";
import type { NotificationType } from "@/lib/domain/types";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeTime } from "@/lib/utils/time";

function getActionPhrase(type: string): string {
  switch (type as NotificationType) {
    case "COMMENTED_ON_YOUR_POST":
      return "commented on your post";
    case "REACTED_TO_YOUR_POST":
      return "reacted to your post";
    case "FOLLOWED_YOU":
      return "followed you";
    default:
      return "notification";
  }
}

function getGroupLabel(g: GroupedNotification): string {
  const phrase = getActionPhrase(g.type);
  const first = g.actors[0]?.name ?? "Someone";
  if (g.actors.length === 1) {
    return `${first} ${phrase}`;
  }
  if (g.actors.length === 2) {
    const second = g.actors[1]?.name ?? "someone";
    return `${first} and ${second} ${phrase}`;
  }
  const othersCount = g.actors.length - 1;
  return `${first} and ${othersCount} others ${phrase}`;
}

function getHref(g: GroupedNotification): string {
  if (
    g.postId &&
    (g.type === "COMMENTED_ON_YOUR_POST" || g.type === "REACTED_TO_YOUR_POST")
  ) {
    return `/post/${g.postId}`;
  }
  const first = g.actors[0];
  if (first) return `/profile/${first.id}`;
  return "#";
}

export function NotificationList({
  grouped,
}: {
  grouped: GroupedNotification[];
}) {
  return (
    <ul className="list-none p-0 space-y-1" role="list">
      {grouped.map((g, i) => {
        const href = getHref(g);
        const label = getGroupLabel(g);
        const firstActor = g.actors[0];
        const timeStr = formatRelativeTime(g.latestCreatedAt);
        return (
          <li key={`${g.type}:${g.postId ?? "n"}:${i}`}>
            <Link
              href={href}
              className={`flex items-center gap-3 rounded-md py-3 px-3 text-[15px] leading-7 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 min-h-[44px] ${
                g.unread ? "bg-gray-50/80" : ""
              }`}
            >
              <span className="shrink-0 w-2 flex justify-center" aria-hidden>
                {g.unread ? (
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                ) : null}
              </span>
              {firstActor ? (
                <Avatar name={firstActor.name} size="sm" className="shrink-0" />
              ) : (
                <span className="shrink-0 w-8 h-8 rounded-full bg-gray-200" aria-hidden />
              )}
              <span className={`min-w-0 flex-1 ${g.unread ? "font-medium text-gray-900" : "text-gray-800"}`}>
                {label}
              </span>
              <time
                dateTime={g.latestCreatedAt.toISOString()}
                className="shrink-0 text-xs text-neutral-500"
              >
                {timeStr}
              </time>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
