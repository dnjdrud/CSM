import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, listConversations } from "@/lib/data/repository";
import { TimelineContainer } from "@/components/TimelineContainer";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeTime } from "@/lib/utils/time";

export default async function MessagesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/feed");

  const conversations = await listConversations(currentUser.id);

  return (
    <TimelineContainer>
      <div className="px-4 py-6">
        <h1 className="text-[17px] font-semibold text-theme-text tracking-tight mb-4">메시지</h1>

        {conversations.length === 0 ? (
          <EmptyState
            title="메시지가 없습니다"
            description="프로필 페이지에서 메시지 버튼을 눌러 대화를 시작해보세요."
          />
        ) : (
          <ul className="list-none p-0 space-y-0.5" role="list">
            {conversations.map((conv) => {
              const isUnread = conv.unreadCount > 0;
              const isSentByMe = conv.latestMessage.senderId === currentUser.id;
              return (
                <li key={conv.partner.id}>
                  <Link
                    href={`/messages/${conv.partner.id}`}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-theme-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 transition-colors ${
                      isUnread ? "bg-theme-surface-2/60" : ""
                    }`}
                  >
                    <Avatar name={conv.partner.name} src={conv.partner.avatarUrl} size="md" className="shrink-0 h-10 w-10" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={`text-[15px] truncate ${isUnread ? "font-semibold text-theme-text" : "font-medium text-theme-text"}`}>
                          {conv.partner.name}
                        </span>
                        <time className="shrink-0 text-[11px] text-theme-muted">
                          {formatRelativeTime(new Date(conv.latestMessage.createdAt))}
                        </time>
                      </div>
                      <p className={`text-[13px] truncate mt-0.5 ${isUnread ? "text-theme-text font-medium" : "text-theme-muted"}`}>
                        {isSentByMe ? "나: " : ""}{conv.latestMessage.content}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="shrink-0 min-w-[1.25rem] h-5 rounded-full bg-theme-primary text-white text-[11px] font-medium flex items-center justify-center px-1.5">
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </TimelineContainer>
  );
}
