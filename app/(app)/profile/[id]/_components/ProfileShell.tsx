"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@/lib/domain/types";
import { ROLE_DISPLAY } from "@/lib/domain/types";
import { Avatar } from "@/components/ui/Avatar";
import { ProfileTabs } from "./ProfileTabs";
import { ProfileFollowButton } from "./ProfileFollowButton";
import { UserActionsMenu } from "./UserActionsMenu";

type ProfileTab = "posts" | "notes" | "testimonies";

function getActiveTab(pathname: string): ProfileTab {
  if (pathname.endsWith("/notes")) return "notes";
  if (pathname.endsWith("/testimonies")) return "testimonies";
  return "posts";
}

type Props = {
  user: User;
  currentUserId: string | null;
  following: boolean;
  isMuted: boolean;
  isBlocked: boolean;
  postsCount: number;
  followerCount: number;
  followingCount: number;
  username?: string | null;
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
  username,
  children,
}: Props) {
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname ?? "");
  const isOwnProfile = currentUserId === user.id;

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar: Back, name, Follow/menu (Threads-style) */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
        <Link
          href="/feed"
          className="text-[15px] text-gray-600 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
          aria-label="Back to feed"
        >
          ←
        </Link>
        <span className="flex-1 truncate text-center text-[15px] font-semibold text-gray-900">
          {user.name}
        </span>
        <div className="flex w-[72px] justify-end items-center gap-1">
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
              href="/me"
              className="text-[13px] font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded px-2 py-1.5"
            >
              Edit
            </Link>
          )}
        </div>
      </header>

      {/* Cover strip */}
      <div
        className="h-24 bg-gradient-to-br from-gray-100 to-gray-200"
        aria-hidden
      />

      {/* Profile card: avatar overlapping, name, handle, bio */}
      <div className="px-4 pb-0">
        <div className="flex flex-col gap-3" style={{ marginTop: "-48px" }}>
          <Avatar
            name={user.name}
            size="md"
            className="h-20 w-20 shrink-0 rounded-full border-4 border-white bg-gray-200 text-xl shadow"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {user.name}
            </h1>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              {username ? `@${username}` : ROLE_DISPLAY[user.role]}
            </p>
          </div>
          {user.bio && (
            <p className="text-[14px] text-gray-700 leading-relaxed whitespace-pre-wrap">
              {user.bio}
            </p>
          )}
          {user.affiliation && (
            <p className="text-[13px] text-neutral-500">{user.affiliation}</p>
          )}

          {/* Stats row (Threads: posts · followers · following) */}
          <div className="flex items-center gap-4 text-[13px] text-gray-600">
            <span>
              <strong className="text-gray-900">{postsCount}</strong> posts
            </span>
            <span>
              <strong className="text-gray-900">{followerCount}</strong> followers
            </span>
            <span>
              <strong className="text-gray-900">{followingCount}</strong> following
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <ProfileTabs profileId={user.id} activeTab={activeTab} />
      </div>

      {/* Tab content */}
      <div className="border-t border-gray-200">{children}</div>
    </div>
  );
}
