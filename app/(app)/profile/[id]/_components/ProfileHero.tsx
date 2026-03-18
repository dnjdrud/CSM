import Link from "next/link";
import type { User } from "@/lib/domain/types";
import { ROLE_DISPLAY } from "@/lib/domain/types";
import { Avatar } from "@/components/ui/Avatar";
import { ProfileFollowButton } from "./ProfileFollowButton";
import { UserActionsMenu } from "./UserActionsMenu";

type Props = {
  user: User;
  isOwnProfile: boolean;
  following: boolean;
  isMuted: boolean;
  isBlocked: boolean;
  currentUserId: string | null;
};

export function ProfileHero({
  user,
  isOwnProfile,
  following,
  isMuted,
  isBlocked,
  currentUserId,
}: Props) {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex gap-3">
        <Avatar name={user.name} src={user.avatarUrl} size="md" className="shrink-0 h-11 w-11 text-sm" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold text-theme-text tracking-tight truncate">
            {user.name}
          </h1>
          <p className="mt-0.5 text-[13px] text-theme-muted">
            {ROLE_DISPLAY[user.role]}
          </p>
        </div>
      </div>
      {(user.affiliation || user.bio) && (
        <div className="space-y-0.5">
          {user.affiliation && (
            <p className="text-[13px] text-theme-muted">{user.affiliation}</p>
          )}
          {user.bio && (
            <p
              className="text-[14px] text-theme-text-2 leading-6 line-clamp-2"
              title={user.bio}
            >
              {user.bio}
            </p>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        {currentUserId && !isOwnProfile && (
          <>
            <ProfileFollowButton profileId={user.id} following={following} />
            <Link
              href={`/messages/${user.id}`}
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-button border border-theme-border bg-transparent px-3 py-2.5 text-[13px] font-medium text-theme-text transition-colors duration-[120ms] hover:bg-theme-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 active:opacity-80"
            >
              메시지
            </Link>
            <UserActionsMenu
              targetUserId={user.id}
              targetUserName={user.name}
              isMuted={isMuted}
              isBlocked={isBlocked}
            />
          </>
        )}
        {!isOwnProfile && user.supportUrl && (
          <a
            href={user.supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 rounded-button border border-theme-border bg-transparent px-3 py-2.5 text-[13px] font-medium text-theme-text transition-colors duration-[120ms] hover:bg-theme-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 active:opacity-80"
          >
            🙌 후원하기
          </a>
        )}
      </div>
    </header>
  );
}
