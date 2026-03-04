import { FeedInfiniteList } from "./FeedInfiniteList";
import type { PostWithAuthor } from "@/lib/domain/types";

type Props = {
  initialItems: PostWithAuthor[];
  initialNextCursorStr: string | null;
  scope: "ALL" | "FOLLOWING";
  currentUserId: string | null;
  followingIds: string[];
};

export function FeedList({
  initialItems,
  initialNextCursorStr,
  scope,
  currentUserId,
  followingIds,
}: Props) {
  return (
    <FeedInfiniteList
      initialItems={initialItems}
      initialNextCursorStr={initialNextCursorStr}
      scope={scope}
      currentUserId={currentUserId}
      followingIds={followingIds}
    />
  );
}
