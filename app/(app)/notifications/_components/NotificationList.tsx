"use client";

import Link from "next/link";
import type { GroupedNotification } from "@/lib/notifications/groupNotifications";
import type { NotificationType } from "@/lib/domain/types";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeTime } from "@/lib/utils/time";

function getActionPhrase(type: string): string {
  switch (type as NotificationType) {
    case "COMMENTED_ON_YOUR_POST":
      return "게시물에 댓글을 달았습니다";
    case "REACTED_TO_YOUR_POST":
      return "게시물에 반응했습니다";
    case "FOLLOWED_YOU":
      return "팔로우했습니다";
    case "REPLIED_TO_YOUR_COMMENT":
      return "댓글에 답글을 달았습니다";
    case "REACTED_TO_YOUR_COMMENT":
      return "댓글에 좋아요를 눌렀습니다";
    case "MENTIONED_IN_COMMENT":
      return "댓글에서 회원님을 멘션했습니다";
    case "NEW_MESSAGE":
      return "메시지를 보냈습니다";
    default:
      return "알림";
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
  if (g.type === "NEW_MESSAGE") {
    const first = g.actors[0];
    return first ? `/messages/${first.id}` : "/messages";
  }
  if (g.postId) {
    return `/post/${g.postId}`;
  }
  const first = g.actors[0];
  if (first) return `/profile/${first.id}`;
  return "#";
}

export function NotificationList({
  grouped,
  onMarkRead,
}: {
  grouped: GroupedNotification[];
  onMarkRead?: (ids: string[]) => void;
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
              onClick={() => {
                if (g.unread && onMarkRead) onMarkRead(g.ids);
              }}
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
                <Avatar name={firstActor.name} src={firstActor.avatarUrl} size="sm" className="shrink-0" />
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
