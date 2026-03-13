"use client";

import Link from "next/link";
import type { User } from "@/lib/domain/types";
import { ROLE_DISPLAY } from "@/lib/domain/types";
import { Avatar } from "@/components/ui/Avatar";
import { SubscribeButton } from "@/components/ui/SubscribeButton";
import { ProfileTabs } from "./ProfileTabs";
import { ProfileFollowButton } from "./ProfileFollowButton";
import { UserActionsMenu } from "./UserActionsMenu";
import { useT } from "@/lib/i18n";

type Props = {
  user: User;
  currentUserId: string | null;
  following: boolean;
  isMuted: boolean;
  isBlocked: boolean;
  postsCount: number;
  followerCount: number;
  followingCount: number;
  subscriberCount?: number;
  isSubscribed?: boolean;
  children: React.ReactNode;
};

export function ProfileShell({
  user,
  currentUserId,
  following,
  isMuted,
  isBlocked,
  postsCount,
  followerCount,
  followingCount,
  subscriberCount = 0,
  isSubscribed = false,
  children,
}: Props) {
  const t = useT();
  const isOwnProfile = currentUserId === user.id;

  return (
    <div className="bg-theme-bg min-h-full">
      <div className="mx-auto w-full max-w-2xl min-h-screen border-x border-theme-border bg-theme-surface">

        <section className="px-4 pt-4 pb-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <Link
              href="/home"
              className="text-[13px] text-theme-muted hover:text-theme-text transition-colors"
            >
              {t.profilePage.backHome}
            </Link>
            <div className="flex items-center gap-2">
              {currentUserId && !isOwnProfile && (
                <>
                  <ProfileFollowButton profileId={user.id} following={following} />
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
                  href="/settings/profile"
                  className="text-[13px] font-medium px-3 py-1.5 rounded-xl border border-theme-border bg-theme-surface text-theme-text hover:border-theme-primary/50 transition-all"
                >
                  {t.profilePage.editProfile}
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-start gap-4 mb-3">
            <Avatar name={user.name} src={user.avatarUrl} size="md" className="shrink-0" />
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="text-[18px] font-bold text-theme-text leading-tight">
                {user.name}
              </h1>
              <p className="text-[12px] text-theme-muted">
                {user.username ? `@${user.username} · ` : ""}
                {ROLE_DISPLAY[user.role]}
                {user.denomination ? ` · ${user.denomination}` : ""}
              </p>
              {user.church && (
                <p className="text-[12px] text-theme-muted">{user.church}</p>
              )}
            </div>
          </div>

          {user.bio && (
            <p className="text-[14px] text-theme-text leading-relaxed whitespace-pre-wrap mb-3">
              {user.bio}
            </p>
          )}

          {(user.affiliation || user.faithYears != null) && (
            <div className="flex flex-wrap gap-x-3 text-[12px] text-theme-muted mb-3">
              {user.affiliation && <span>{user.affiliation}</span>}
              {user.faithYears != null && <span>신앙 {user.faithYears}년</span>}
            </div>
          )}

          <div className="flex items-center gap-5 text-[13px] text-theme-muted mb-3">
            <span>
              <strong className="text-theme-text font-semibold">{postsCount}</strong>{" "}
              {t.profile.posts}
            </span>
            <Link href={`/profile/${user.id}/followers`} className="hover:text-theme-text transition-colors">
              <strong className="text-theme-text font-semibold">{followerCount}</strong>{" "}
              {t.profile.followers}
            </Link>
            <Link href={`/profile/${user.id}/following`} className="hover:text-theme-text transition-colors">
              <strong className="text-theme-text font-semibold">{followingCount}</strong>{" "}
              {t.profile.following}
            </Link>
            {subscriberCount > 0 && (
              <span>
                <strong className="text-theme-text font-semibold">
                  {subscriberCount.toLocaleString()}
                </strong>{" "}
                {t.profilePage.crowTab}
              </span>
            )}
          </div>

          {!isOwnProfile && (
            <div className="mb-4">
              <SubscribeButton
                creatorId={user.id}
                initialIsSubscribed={isSubscribed}
                initialCount={subscriberCount}
                isLoggedIn={!!currentUserId}
                variant="full"
              />
            </div>
          )}
        </section>

        <div className="sticky top-0 z-10 bg-theme-surface border-b border-theme-border">
          <ProfileTabs profileId={user.id} />
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
