"use client";

import Link from "next/link";
import type { User } from "@/lib/domain/types";
import { ROLE_DISPLAY } from "@/lib/domain/types";
import { Avatar } from "@/components/ui/Avatar";
import { ProfileTabs } from "./ProfileTabs";
import { ProfileFollowButton } from "./ProfileFollowButton";
import { UserActionsMenu } from "./UserActionsMenu";

type Props = {
  user: User;
  currentUserId: string | null;
  following: boolean;
  isMuted: boolean;
  isBlocked: boolean;
  postsCount: number;
  followerCount: number;
  followingCount: number;
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
  children,
}: Props) {
  const isOwnProfile = currentUserId === user.id;

  return (
    <div className="bg-theme-bg min-h-full">
      <div className="mx-auto w-full max-w-2xl">

        {/* 프로필 헤더 */}
        <section className="px-4 pt-4 pb-0">
          {/* 상단 액션 바 */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <Link
              href="/home"
              className="text-[13px] text-theme-muted hover:text-theme-text transition-colors"
            >
              ← 홈
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
                  프로필 수정
                </Link>
              )}
            </div>
          </div>

          {/* 아바타 + 기본 정보 */}
          <div className="flex items-start gap-4 mb-3">
            <Avatar
              name={user.name}
              src={user.avatarUrl}
              size="md"
              className="shrink-0"
            />
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

          {/* bio */}
          {user.bio && (
            <p className="text-[14px] text-theme-text leading-relaxed whitespace-pre-wrap mb-3">
              {user.bio}
            </p>
          )}

          {/* affiliation / 신앙연수 */}
          {(user.affiliation || user.faithYears != null) && (
            <div className="flex flex-wrap gap-x-3 text-[12px] text-theme-muted mb-3">
              {user.affiliation && <span>{user.affiliation}</span>}
              {user.faithYears != null && <span>신앙 {user.faithYears}년</span>}
            </div>
          )}

          {/* 팔로워 / 팔로잉 / 게시글 수 */}
          <div className="flex items-center gap-5 text-[13px] text-theme-muted mb-4">
            <span>
              <strong className="text-theme-text font-semibold">{postsCount}</strong>{" "}
              게시글
            </span>
            <Link
              href={`/profile/${user.id}/followers`}
              className="hover:text-theme-text transition-colors"
            >
              <strong className="text-theme-text font-semibold">{followerCount}</strong>{" "}
              팔로워
            </Link>
            <Link
              href={`/profile/${user.id}/following`}
              className="hover:text-theme-text transition-colors"
            >
              <strong className="text-theme-text font-semibold">{followingCount}</strong>{" "}
              팔로잉
            </Link>
          </div>
        </section>

        {/* 탭 */}
        <div className="sticky top-0 z-10 bg-theme-surface border-b border-theme-border">
          <ProfileTabs profileId={user.id} />
        </div>

        {/* 탭 콘텐츠 */}
        <div>{children}</div>
      </div>
    </div>
  );
}
