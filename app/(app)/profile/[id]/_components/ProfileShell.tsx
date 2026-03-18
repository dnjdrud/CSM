"use client";

import Link from "next/link";
import type { User } from "@/lib/domain/types";
import { ROLE_DISPLAY } from "@/lib/domain/types";
import { Avatar } from "@/components/ui/Avatar";
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
  /** Whether the current viewer is an active subscriber of this profile */
  viewerIsActiveSubscriber?: boolean;
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
  viewerIsActiveSubscriber = false,
  children,
}: Props) {
  const t = useT();
  const isOwnProfile = currentUserId === user.id;

  return (
    <div className="w-full bg-theme-bg min-h-full">
      <div className="mx-auto w-full max-w-2xl min-h-screen md:border-x border-theme-border bg-theme-surface">

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
                  <Link
                    href={`/messages/${user.id}`}
                    className="text-[13px] font-medium px-3 py-1.5 rounded-xl border border-theme-border bg-theme-surface text-theme-text hover:border-theme-primary/50 transition-all"
                    aria-label="다이렉트 메시지 보내기"
                  >
                    DM
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
                  href="/settings"
                  className="inline-flex items-center justify-center rounded-xl border border-theme-border bg-theme-surface p-2 text-theme-muted hover:text-theme-text hover:border-theme-primary/50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2"
                  aria-label="설정"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                  </svg>
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
            {viewerIsActiveSubscriber && !isOwnProfile && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-theme-primary/10 border border-theme-primary/30 text-theme-primary text-[11px] font-semibold">
                <span aria-hidden>🐦</span> 구독자
              </span>
            )}
          </div>

        </section>

        <div className="sticky top-0 z-10 bg-theme-surface border-b border-theme-border">
          <ProfileTabs profileId={user.id} />
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
