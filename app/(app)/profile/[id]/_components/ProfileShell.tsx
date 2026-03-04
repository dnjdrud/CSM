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
    <div className="bg-white">
      <div className="mx-auto w-full max-w-4xl px-4 py-6">
        {/* Top row: back + actions (match other pages) */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href="/feed"
            className="text-[14px] text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 rounded"
          >
            ← Back to feed
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
                href="/me"
                className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2"
              >
                Edit profile
              </Link>
            )}
          </div>
        </div>

        {/* Profile header card */}
        <section className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-start gap-4">
            <Avatar name={user.name} size="md" className="shrink-0" />
            <div className="min-w-0 flex-1 space-y-1">
              <div>
                <h1 className="text-[18px] font-semibold text-gray-900 truncate">
                  {user.name}
                </h1>
                <p className="mt-0.5 text-[13px] text-neutral-500">
                  {username ? `@${username}` : ROLE_DISPLAY[user.role]}
                </p>
              </div>
              {user.bio && (
                <p className="text-[14px] text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {user.bio}
                </p>
              )}
              {user.affiliation && (
                <p className="text-[13px] text-neutral-500">{user.affiliation}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-4 text-[13px] text-gray-600">
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
        </section>

        {/* Tabs */}
        <div className="mt-6">
          <ProfileTabs profileId={user.id} activeTab={activeTab} />
        </div>

        {/* Tab content */}
        <div className="border-t border-gray-200 bg-white">{children}</div>
      </div>
    </div>
  );
}
