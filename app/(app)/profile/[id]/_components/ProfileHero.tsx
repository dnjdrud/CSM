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
        <Avatar name={user.name} size="md" className="shrink-0 h-11 w-11 text-sm" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight truncate">
            {user.name}
          </h1>
          <p className="mt-0.5 text-[13px] text-neutral-500">
            {ROLE_DISPLAY[user.role]}
          </p>
        </div>
      </div>
      {(user.affiliation || user.bio) && (
        <div className="space-y-0.5">
          {user.affiliation && (
            <p className="text-[13px] text-neutral-500">{user.affiliation}</p>
          )}
          {user.bio && (
            <p
              className="text-[14px] text-gray-700 leading-6 line-clamp-2"
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
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md border border-gray-200 bg-transparent px-3 py-2.5 text-[13px] font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 active:opacity-80"
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
        {isOwnProfile && (
          <Link
            href="/me"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md px-3 py-2.5 text-[13px] font-medium text-neutral-600 transition-colors duration-200 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 active:opacity-80"
          >
            Go to My Space
          </Link>
        )}
        {!isOwnProfile && user.supportUrl && (
          <a
            href={user.supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-transparent px-3 py-2.5 text-[13px] font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 active:opacity-80"
          >
            🙌 후원하기
          </a>
        )}
      </div>
    </header>
  );
}
