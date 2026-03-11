import { FeedInfiniteList } from "./FeedInfiniteList";
import type { PostWithAuthor } from "@/lib/domain/types";

type Props = {
  initialItems: PostWithAuthor[];
  initialNextCursorStr: string | null;
  scope: "ALL" | "FOLLOWING";
  currentUserId: string | null;
  followingIds: string[];
  bookmarkedPostIds?: string[];
};

export function FeedList({
  initialItems,
  initialNextCursorStr,
  scope,
  currentUserId,
  followingIds,
  bookmarkedPostIds = [],
}: Props) {
  return (
    <FeedInfiniteList
      initialItems={initialItems}
      initialNextCursorStr={initialNextCursorStr}
      scope={scope}
      currentUserId={currentUserId}
      followingIds={followingIds}
      bookmarkedPostIds={bookmarkedPostIds}
    />
  );
}
